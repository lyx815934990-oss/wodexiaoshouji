import type { AiConfig } from "../context/AiSettingsContext";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ModelInfo {
  id: string;
  // 其余字段不做严格约束，方便兼容不同厂商
  [key: string]: unknown;
}

function buildRootAndChatUrl(baseUrl: string): { root: string; chatUrl: string } {
  const trimmed = baseUrl.replace(/\s+/g, "");
  const root = trimmed.replace(/\/+(chat\/completions|completions)\/*$/i, "");
  const normalizedRoot = root.replace(/\/+$/g, "");
  const chatUrl = `${normalizedRoot}/chat/completions`;
  return { root: normalizedRoot, chatUrl };
}

export async function sendChatRequest(
  config: AiConfig,
  messages: ChatMessage[]
): Promise<string> {
  if (!config.baseUrl || !config.apiKey || !config.model) {
    throw new Error("缺少 AI 配置：请先在 设置 应用里填写 Base URL、API Key 和模型名称。");
  }

  const { chatUrl } = buildRootAndChatUrl(config.baseUrl);

  const requestBody = {
    model: config.model,
    messages
  };

  console.log("AI请求URL:", chatUrl);
  console.log("AI请求体:", JSON.stringify(requestBody, null, 2));

  const response = await fetch(chatUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`请求失败：${response.status} ${text}`);
  }

  const data = (await response.json()) as any;
  
  console.log("AI响应原始数据:", JSON.stringify(data, null, 2));
  
  // 尝试多种方式提取内容
  let content =
    data?.choices?.[0]?.message?.content ?? 
    data?.choices?.[0]?.text ??
    data?.message?.content ?? 
    data?.content ?? 
    data?.text ??
    "";

  // 如果还是没有内容，尝试从 choices 数组中查找
  if (!content && Array.isArray(data?.choices)) {
    for (const choice of data.choices) {
      if (choice?.message?.content && choice.message.content.trim()) {
        content = choice.message.content;
        break;
      }
      if (choice?.text && choice.text.trim()) {
        content = choice.text;
        break;
      }
    }
  }

  // 如果还是没有内容，检查 finish_reason 和其他信息
  if (!content || !content.trim()) {
    const firstChoice = data?.choices?.[0];
    const finishReason = firstChoice?.finish_reason;
    const finishDetails = firstChoice?.finish_details;
    
    console.error("AI响应内容为空，详细信息:", {
      finish_reason: finishReason,
      finish_details: finishDetails,
      choice: firstChoice,
      fullResponse: data
    });
    
    // 根据 finish_reason 提供更具体的错误信息
    let errorMsg = "AI 没有返回内容";
    if (finishReason === "content_filter") {
      errorMsg = "AI 内容被过滤，可能是提示词或生成内容触发了安全策略。请尝试调整提示词或检查模型设置。";
    } else if (finishReason === "length") {
      errorMsg = "AI 响应被截断（达到最大长度限制）。";
    } else if (finishReason === "stop") {
      errorMsg = "AI 正常停止但未生成内容，可能是模型配置问题。";
    } else if (finishReason) {
      errorMsg = `AI 响应结束原因：${finishReason}，未生成内容。`;
    }
    
    errorMsg += `\n\n响应数据：${JSON.stringify(data).substring(0, 300)}${JSON.stringify(data).length > 300 ? "..." : ""}`;
    throw new Error(errorMsg);
  }

  return content.trim();
}

export async function fetchModels(config: AiConfig): Promise<ModelInfo[]> {
  if (!config.baseUrl || !config.apiKey) {
    throw new Error("请先填写 API Base URL 和 API Key。");
  }

  const { root } = buildRootAndChatUrl(config.baseUrl);
  const url = `${root}/models`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.apiKey}`
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`拉取模型失败：${response.status} ${text}`);
  }

  const data = (await response.json()) as any;
  const list: any[] = data?.data ?? data?.models ?? [];
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error("接口返回中没有发现模型列表，请确认是否为 OpenAI 兼容接口。");
  }

  return list.map((m) => ({
    id: m.id ?? m.name ?? "unknown-model",
    ...m
  }));
}

/**
 * 生成图片（支持 Gemini API）
 * @param config AI配置
 * @param prompt 图片生成提示词
 * @returns 图片的 base64 数据 URL 或图片 URL
 */
export async function generateImage(
  config: AiConfig,
  prompt: string
): Promise<string> {
  if (!config.baseUrl || !config.apiKey || !config.model) {
    throw new Error("缺少 AI 配置：请先在 设置 应用里填写 Base URL、API Key 和模型名称。");
  }

  const baseUrl = config.baseUrl.replace(/\s+/g, "").replace(/\/+$/g, "");
  
  // 检测是否为 Gemini API（通常包含 googleapis.com 或 gemini）
  const isGemini = baseUrl.includes("googleapis.com") || baseUrl.includes("gemini") || config.model.includes("gemini");
  
  if (isGemini) {
    // Gemini API 图片生成
    // Gemini 使用 generateContent API，但图片生成可能需要特殊处理
    // 注意：Gemini 3 Flash Preview 可能不支持直接图片生成，需要检查 API 文档
    // 这里提供一个通用的实现，如果 API 不支持会返回错误
    
    // 尝试使用 Gemini 的 generateContent API
    // 格式：https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
    let generateUrl = baseUrl;
    if (baseUrl.includes("googleapis.com")) {
      // 标准 Gemini API URL
      const modelName = config.model.replace(/^models\//, "");
      generateUrl = `${baseUrl.replace(/\/v1beta.*$/, "")}/v1beta/models/${modelName}:generateContent`;
    } else {
      // 自定义代理 URL，尝试添加 generateContent 端点
      generateUrl = `${baseUrl}/v1beta/models/${config.model}:generateContent`;
    }

    console.log("[generateImage] Gemini API 图片生成请求URL:", generateUrl);
    console.log("[generateImage] 提示词:", prompt);

    // Gemini API 的请求格式
    const requestBody = {
      contents: [{
        parts: [{
          text: `请生成一张图片，描述：${prompt}。请返回图片的 base64 编码数据。`
        }]
      }],
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    };

    try {
      const response = await fetch(generateUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": config.apiKey // Gemini 使用 x-goog-api-key
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("[generateImage] Gemini API 请求失败:", response.status, text);
        throw new Error(`Gemini API 图片生成失败：${response.status} ${text}`);
      }

      const data = (await response.json()) as any;
      console.log("[generateImage] Gemini API 响应:", JSON.stringify(data, null, 2));

      // 尝试从响应中提取图片数据
      // Gemini 的图片生成可能返回 base64 编码的图片
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (content) {
        // 如果返回的是 base64 编码的图片数据
        if (content.startsWith("data:image") || content.startsWith("iVBORw0KGgo")) {
          // 如果是 base64 数据 URL，直接返回
          if (content.startsWith("data:image")) {
            return content;
          }
          // 如果是纯 base64 字符串，添加 data URL 前缀
          return `data:image/png;base64,${content}`;
        }
      }

      // 如果 Gemini API 不支持图片生成，尝试使用文本生成的方式
      // 提示 AI 返回一个图片 URL 或 base64 数据
      throw new Error("Gemini API 可能不支持直接图片生成，请检查 API 文档或使用支持图片生成的模型");
    } catch (error) {
      console.error("[generateImage] Gemini 图片生成失败:", error);
      throw error;
    }
  } else {
    // OpenAI 兼容 API 的图片生成（DALL-E 等）
    // 通常使用 /v1/images/generations 端点
    const { root } = buildRootAndChatUrl(baseUrl);
    const imageUrl = `${root}/images/generations`;

    console.log("[generateImage] OpenAI 兼容 API 图片生成请求URL:", imageUrl);
    console.log("[generateImage] 提示词:", prompt);

    const requestBody = {
      model: "dall-e-3", // 默认使用 DALL-E 3，如果 API 不支持会自动降级
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "url" // 或 "b64_json" 返回 base64
    };

    try {
      const response = await fetch(imageUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("[generateImage] OpenAI 兼容 API 请求失败:", response.status, text);
        throw new Error(`图片生成失败：${response.status} ${text}`);
      }

      const data = (await response.json()) as any;
      console.log("[generateImage] OpenAI 兼容 API 响应:", JSON.stringify(data, null, 2));

      // 提取图片 URL 或 base64 数据
      if (data.data && data.data.length > 0) {
        const imageData = data.data[0];
        if (imageData.url) {
          return imageData.url;
        }
        if (imageData.b64_json) {
          return `data:image/png;base64,${imageData.b64_json}`;
        }
      }

      throw new Error("API 返回的图片数据格式不正确");
    } catch (error) {
      console.error("[generateImage] 图片生成失败:", error);
      throw error;
    }
  }
}


