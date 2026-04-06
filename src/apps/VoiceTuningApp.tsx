import React from 'react';
import { appStorage } from '../storage/appStorage';

// 本地存储键：仅保存在当前设备浏览器
const STORAGE_KEY = 'mini-ai-phone.voice-tuning-settings';
const VOICE_NOTES_KEY = 'mini-ai-phone.voice-notes';
const ROLES_STORAGE_KEY = 'mini-ai-phone.story-roles';

type VoiceTuningSettings = {
  groupId: string;
  apiKey: string;
  voiceId: string;
};

const loadSettings = (): VoiceTuningSettings => {
  try {
    const raw = appStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        groupId: '',
        apiKey: '',
        voiceId: ''
      };
    }
    const parsed = JSON.parse(raw) as Partial<VoiceTuningSettings>;
    return {
      groupId: parsed.groupId ?? '',
      apiKey: parsed.apiKey ?? '',
      voiceId: parsed.voiceId ?? ''
    };
  } catch {
    return {
      groupId: '',
      apiKey: '',
      voiceId: ''
    };
  }
};

const saveSettings = (settings: VoiceTuningSettings) => {
  try {
    appStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
};

const DEFAULT_CN_BASE_URL = 'https://api.minimaxi.com/v1';

type ManagedVoice = {
  voiceId: string;
  voiceName?: string;
  description?: string;
  type: 'voice_cloning' | 'voice_generation';
  createdTime?: string;
};

type StoryRole = {
  id: string;
  name: string;
  avatarUrl: string;
  minimaxVoiceId?: string;
  wechatNickname?: string;
};

const loadVoiceNotes = (): Record<string, string> => {
  try {
    const raw = appStorage.getItem(VOICE_NOTES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
};

const saveVoiceNotes = (notes: Record<string, string>) => {
  try {
    appStorage.setItem(VOICE_NOTES_KEY, JSON.stringify(notes));
  } catch {
    // ignore
  }
};

const loadRoles = (): StoryRole[] => {
  try {
    const raw = appStorage.getItem(ROLES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // 只返回在微信联系人中的角色
    const WECHAT_CONTACTS_KEY = 'mini-ai-phone.wechat-contacts';
    const rawContacts = appStorage.getItem(WECHAT_CONTACTS_KEY);
    const contactList: { roleId: string }[] = rawContacts ? JSON.parse(rawContacts) : [];
    const aliveRoleIdSet = new Set(
      Array.isArray(contactList) ? contactList.map((c: any) => String(c.roleId)) : []
    );
    
    return parsed
      .filter((r: any) => r && aliveRoleIdSet.has(String(r.id ?? r.roleId)))
      .map((r: any) => ({
        id: String(r.id ?? r.roleId ?? ''),
        name: String(r.name ?? r.wechatNickname ?? '未命名角色'),
        avatarUrl: typeof r.avatarUrl === 'string' ? r.avatarUrl : '',
        minimaxVoiceId: typeof r.minimaxVoiceId === 'string' ? r.minimaxVoiceId : undefined,
        wechatNickname: typeof r.wechatNickname === 'string' ? r.wechatNickname : undefined
      }));
  } catch {
    return [];
  }
};

const saveRoleVoiceId = (roleId: string, voiceId: string) => {
  try {
    const raw = appStorage.getItem(ROLES_STORAGE_KEY);
    if (!raw) return;
    const roles = JSON.parse(raw) as any[];
    const updated = roles.map((r: any) => {
      if (String(r.id ?? r.roleId) === roleId) {
        const newRole = { ...r };
        if (voiceId) {
          newRole.minimaxVoiceId = voiceId;
        } else {
          delete newRole.minimaxVoiceId;
        }
        return newRole;
      }
      return r;
    });
    appStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
};

export const VoiceTuningApp: React.FC = () => {
  const [settings, setSettings] = React.useState<VoiceTuningSettings>(() => loadSettings());
  const [message, setMessage] = React.useState<string | null>(null);
  const [testing, setTesting] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'key' | 'voice'>('key');
  const [voices, setVoices] = React.useState<ManagedVoice[]>([]);
  const [loadingVoices, setLoadingVoices] = React.useState(false);
  const [voiceNotes, setVoiceNotes] = React.useState<Record<string, string>>(() => loadVoiceNotes());
  const [editingNoteVoiceId, setEditingNoteVoiceId] = React.useState<string | null>(null);
  const [noteInput, setNoteInput] = React.useState<string>('');
  const [roles, setRoles] = React.useState<StoryRole[]>(() => loadRoles());

  const update = (patch: Partial<VoiceTuningSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  };

  const handleSave = () => {
    saveSettings(settings);
    setMessage('配置已保存');
    setTimeout(() => setMessage(null), 2000);
  };

  const handleSaveNote = (voiceId: string) => {
    const updated = { ...voiceNotes, [voiceId]: noteInput.trim() };
    setVoiceNotes(updated);
    saveVoiceNotes(updated);
    setEditingNoteVoiceId(null);
    setNoteInput('');
    setMessage('备注已保存');
    setTimeout(() => setMessage(null), 2000);
  };

  const handleEditNote = (voiceId: string) => {
    setEditingNoteVoiceId(voiceId);
    setNoteInput(voiceNotes[voiceId] || '');
  };

  const handleCopyVoiceId = (voiceId: string) => {
    navigator.clipboard.writeText(voiceId).then(() => {
      setMessage(`已复制音色ID：${voiceId}`);
      setTimeout(() => setMessage(null), 2000);
    }).catch(() => {
      setMessage('复制失败，请手动复制');
      setTimeout(() => setMessage(null), 2000);
    });
  };

  const handleAssignVoiceToRole = (roleId: string, voiceId: string) => {
    saveRoleVoiceId(roleId, voiceId);
    setRoles(loadRoles());
    setMessage(`已为角色配置音色ID：${voiceId}`);
    setTimeout(() => setMessage(null), 2000);
  };

  React.useEffect(() => {
    setRoles(loadRoles());
  }, []);

  const handleLoadVoices = async () => {
    const apiKey = settings.apiKey.trim();
    if (!apiKey) {
      setMessage('请先填写 MiniMax 的 API Key，才能查询账号下的音色列表。');
      return;
    }

    const url = `${DEFAULT_CN_BASE_URL.replace(/\/+$/, '')}/get_voice`;
    setLoadingVoices(true);
    setMessage(null);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({ voice_type: 'all' })
      });
      if (!res.ok) {
        const errorText = res.statusText || `HTTP ${res.status}`;
        throw new Error(`接口请求失败：${errorText}`);
      }
      const data = (await res.json()) as any;
      const baseResp = (data && (data.base_resp || data.baseResp)) as
        | { status_code?: number; status_msg?: string }
        | undefined;
      if (baseResp && typeof baseResp.status_code === 'number' && baseResp.status_code !== 0) {
        throw new Error(baseResp.status_msg || `接口返回错误码 ${baseResp.status_code}`);
      }

      const customs: ManagedVoice[] = [];
      const pushList = (items: any[] | undefined, type: 'voice_cloning' | 'voice_generation') => {
        if (!Array.isArray(items)) return;
        items.forEach((item) => {
          const voiceId = item.voice_id || item.voiceId;
          if (!voiceId || typeof voiceId !== 'string') return;
          const descArr: string[] | undefined = Array.isArray(item.description)
            ? (item.description as string[])
            : undefined;
          customs.push({
            voiceId,
            voiceName: item.voice_name || item.voiceName,
            description: descArr && descArr.length ? descArr[0] : undefined,
            type,
            createdTime: item.created_time || item.createdTime
          });
        });
      };

      // 只收集自定义音色，不包含系统音色
      pushList(data.voice_cloning || data.voiceCloning, 'voice_cloning');
      pushList(data.voice_generation || data.voiceGeneration, 'voice_generation');

      setVoices(customs);
      setMessage(`已载入 ${customs.length} 条自定义音色记录。`);
    } catch (err) {
      const msg = (err as Error).message || String(err);
      setMessage(`拉取音色列表失败：${msg}`);
    } finally {
      setLoadingVoices(false);
    }
  };

  const handleTest = async () => {
    const apiKey = settings.apiKey.trim();
    const voiceId = settings.voiceId.trim();
    const groupId = settings.groupId.trim();

    if (!apiKey) {
      setMessage('请先填写 API Key');
      return;
    }
    if (!voiceId) {
      setMessage('请先填写 Voice ID');
      return;
    }

    setTesting(true);
    setMessage(null);

    try {
      const baseUrl = DEFAULT_CN_BASE_URL;
      const url = `${baseUrl.replace(/\/+$/, '')}/t2a_v2`;
      const testText = '测试连接';

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'speech-2.8-hd',
          text: testText,
          stream: false,
          voice_setting: {
            voice_id: voiceId,
            speed: 1,
            vol: 1,
            pitch: 0
          },
          audio_setting: {
            sample_rate: 32000,
            bitrate: 128000,
            format: 'mp3',
            channel: 1
          },
          subtitle_enable: false
        })
      });

      if (!res.ok) {
        const errorText = res.statusText || `HTTP ${res.status}`;
        throw new Error(`连接失败：${errorText}`);
      }

      const data = (await res.json()) as any;
      const baseResp = (data && (data.base_resp || data.baseResp)) as
        | { status_code?: number; status_msg?: string }
        | undefined;

      if (baseResp && typeof baseResp.status_code === 'number' && baseResp.status_code !== 0) {
        throw new Error(baseResp.status_msg || `接口返回错误码 ${baseResp.status_code}`);
      }

      const hexAudio =
        (data && data.data && (data.data.audio || data.data.audio_hex)) ||
        (data && (data.audio || data.audio_hex));

      if (!hexAudio || typeof hexAudio !== 'string') {
        throw new Error('接口返回中没有找到音频数据');
      }

      setMessage('✅ 连接成功！配置正确，可以正常使用。');
    } catch (err) {
      const msg = (err as Error).message || String(err);
      setMessage(`❌ 连接失败：${msg}`);
    } finally {
      setTesting(false);
    }
  };

  return (
      <div
        className="app-content"
        style={{
          padding: '24px 18px 8px',
          overflowY: 'auto',
          background: '#ffffff',
          boxSizing: 'border-box'
        }}
      >
      <div
        style={{
          maxWidth: 380,
          margin: '0 auto',
          backgroundColor: '#ffffff',
          borderRadius: 18,
          padding: '16px 18px 8px',
          boxSizing: 'border-box'
        }}
      >
      {/* 导航卡片 */}
      <div style={{ marginBottom: 20, display: 'flex', gap: 12 }}>
        <button
          type="button"
          onClick={() => setActiveTab('key')}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 12,
            border: 'none',
            backgroundColor: activeTab === 'key' ? '#111827' : '#f9fafb',
            color: activeTab === 'key' ? '#ffffff' : '#6b7280',
            fontSize: 14,
            fontWeight: activeTab === 'key' ? 600 : 500,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Key配置
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('voice')}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 12,
            border: 'none',
            backgroundColor: activeTab === 'voice' ? '#111827' : '#f9fafb',
            color: activeTab === 'voice' ? '#ffffff' : '#6b7280',
            fontSize: 14,
            fontWeight: activeTab === 'voice' ? 600 : 500,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          角色音色配置
        </button>
      </div>

      <section style={{ marginBottom: 20 }}>
        {activeTab === 'key' ? (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0px 0 16px', color: '#111827' }}>
                MiniMax 语音合成配置
            </h3>
            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, margin: '0 0 12px' }}>
                在这里配置 MiniMax 语音合成的基本信息，所有内容仅存储在本设备浏览器中。
            </p>
            <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <a
            href="https://platform.minimaxi.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              backgroundColor: '#ffffff',
              color: '#111827',
              fontSize: 12,
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.borderColor = '#111827';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          >
            <span>🔑</span>
            <span>前往 MiniMax 控制台申请密钥</span>
            <span style={{ fontSize: 10 }}>↗</span>
          </a>
          <a
            href="https://www.minimaxi.com/audio/voice-design"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              backgroundColor: '#ffffff',
              color: '#111827',
              fontSize: 12,
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.borderColor = '#111827';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          >
            <span>🎨</span>
            <span>前往音色设计</span>
            <span style={{ fontSize: 10 }}>↗</span>
          </a>
        </div>
          
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#4b5563', marginBottom: 4 }}>
              Group ID
          </label>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, lineHeight: 1.5 }}>
            MiniMax 工作组的唯一标识符，用于区分不同的项目或团队。可在 MiniMax 控制台的工作组设置中查看。
          </div>
          <input
              type="text"
              value={settings.groupId}
              onChange={(e) => update({ groupId: e.target.value })}
              placeholder="请输入 MiniMax Group ID"
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              fontSize: 13,
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#4b5563', marginBottom: 4 }}>
              API Key
          </label>
          <input
              type="password"
              value={settings.apiKey}
              onChange={(e) => update({ apiKey: e.target.value })}
              placeholder="请输入 MiniMax API Key"
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              fontSize: 13,
              boxSizing: 'border-box'
            }}
          />
          </div>

          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={handleSave}
              style={{
                flex: 1,
                padding: '7px 0',
                borderRadius: 999,
                border: 'none',
                backgroundColor: '#111827',
                color: '#ffffff',
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              保存配置
            </button>
            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              style={{
                flex: 1,
                padding: '7px 0',
                borderRadius: 999,
                border: '1px solid #d1d5db',
                backgroundColor: testing ? '#9ca3af' : '#ffffff',
                color: testing ? '#ffffff' : '#111827',
                fontSize: 13,
                cursor: testing ? 'default' : 'pointer'
              }}
            >
              {testing ? '测试中...' : '测试连接'}
            </button>
          </div>

          {message && (
            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                color: message.startsWith('✅') ? '#059669' : message.startsWith('❌') ? '#dc2626' : '#059669',
                padding: '8px 10px',
                borderRadius: 8,
                backgroundColor: message.startsWith('✅') ? '#f0fdf4' : message.startsWith('❌') ? '#fef2f2' : '#f0fdf4',
                border: `1px solid ${message.startsWith('✅') ? '#86efac' : message.startsWith('❌') ? '#fecaca' : '#86efac'}`
              }}
            >
              {message}
            </div>
          )}
          </>
        ) : (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0px 0 16px', color: '#111827' }}>
                角色音色配置
            </h3>
            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, margin: '0 0 12px' }}>
                管理角色的自定义音色，从账号中拉取已创建的音色列表。
            </p>
            <div style={{ marginBottom: 12 }}>
              <button
                type="button"
                onClick={handleLoadVoices}
                disabled={loadingVoices}
                style={{
                  width: '100%',
                  padding: '10px 0',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  backgroundColor: loadingVoices ? '#9ca3af' : '#ffffff',
                  color: loadingVoices ? '#ffffff' : '#111827',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: loadingVoices ? 'default' : 'pointer'
                }}
              >
                {loadingVoices ? '拉取中...' : '拉取音色列表'}
              </button>
            </div>
            {voices.length > 0 && (
              <div
                style={{
                  maxHeight: 400,
                  overflowY: 'auto',
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  padding: '12px',
                  fontSize: 12,
                  color: '#374151'
                }}
              >
                {voices.map((v) => (
                  <div
                    key={`${v.type}-${v.voiceId}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '12px',
                      borderBottom: '1px solid #f3f4f6',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {v.voiceId}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              padding: '2px 6px',
                              borderRadius: 999,
                              backgroundColor: v.type === 'voice_cloning' ? '#dbeafe' : '#fef3c7',
                              color: v.type === 'voice_cloning' ? '#1d4ed8' : '#92400e',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {v.type === 'voice_cloning' ? '快速复刻' : '文生音色'}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditNote(v.voiceId);
                          }}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 6,
                            border: '1px solid #d1d5db',
                            backgroundColor: '#ffffff',
                            color: '#6b7280',
                            fontSize: 11,
                            cursor: 'pointer'
                          }}
                        >
                          备注
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyVoiceId(v.voiceId);
                          }}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 6,
                            border: '1px solid #d1d5db',
                            backgroundColor: '#ffffff',
                            color: '#6b7280',
                            fontSize: 11,
                            cursor: 'pointer'
                          }}
                        >
                          复制ID
                        </button>
                      </div>
                    </div>
                    {editingNoteVoiceId === v.voiceId ? (
                      <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                        <input
                          type="text"
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          placeholder="输入备注"
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            borderRadius: 6,
                            border: '1px solid #d1d5db',
                            fontSize: 12,
                            boxSizing: 'border-box'
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveNote(v.voiceId);
                            } else if (e.key === 'Escape') {
                              setEditingNoteVoiceId(null);
                              setNoteInput('');
                            }
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveNote(v.voiceId)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: 'none',
                            backgroundColor: '#111827',
                            color: '#ffffff',
                            fontSize: 12,
                            cursor: 'pointer'
                          }}
                        >
                          保存
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNoteVoiceId(null);
                            setNoteInput('');
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid #d1d5db',
                            backgroundColor: '#ffffff',
                            color: '#6b7280',
                            fontSize: 12,
                            cursor: 'pointer'
                          }}
                        >
                          取消
                        </button>
                      </div>
                    ) : voiceNotes[v.voiceId] ? (
                      <div style={{ marginTop: 4, padding: '6px 8px', backgroundColor: '#f9fafb', borderRadius: 6, fontSize: 12, color: '#6b7280' }}>
                        备注：{voiceNotes[v.voiceId]}
                      </div>
                    ) : null}
                    {v.voiceName && (
                      <div style={{ marginTop: 4, color: '#6b7280', fontSize: 12 }}>名称：{v.voiceName}</div>
                    )}
                    {v.description && (
                      <div style={{ marginTop: 4, color: '#6b7280', fontSize: 12 }}>描述：{v.description}</div>
                    )}
                    {v.createdTime && (
                      <div style={{ marginTop: 4, color: '#9ca3af', fontSize: 11 }}>
                        创建时间：{v.createdTime}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {roles.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px', color: '#111827' }}>
                  当前角色列表
                </h4>
                <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
                  为每个角色配置专属音色，配置后会同步到聊天设定中
                </p>
                <div
                  style={{
                    borderRadius: 12,
                    border: '1px solid #e5e7eb',
                    padding: '12px',
                    fontSize: 12,
                    color: '#374151'
                  }}
                >
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 0',
                        borderBottom: '1px solid #f3f4f6'
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          backgroundColor: '#f3f4f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}
                      >
                        {role.avatarUrl ? (
                          <img src={role.avatarUrl} alt={role.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: 16, color: '#9ca3af' }}>像</span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 13, color: '#111827', marginBottom: 4 }}>
                          {role.name}
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>
                          {role.minimaxVoiceId ? (
                            <span>音色ID：{role.minimaxVoiceId}</span>
                          ) : (
                            <span style={{ color: '#9ca3af' }}>未配置音色</span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {voices.length > 0 ? (
                          <>
                            <select
                              value={role.minimaxVoiceId || ''}
                              onChange={(e) => {
                                const voiceId = e.target.value;
                                if (voiceId) {
                                  handleAssignVoiceToRole(role.id, voiceId);
                                } else {
                                  // 清空音色
                                  saveRoleVoiceId(role.id, '');
                                  setRoles(loadRoles());
                                }
                              }}
                              style={{
                                padding: '6px 8px',
                                borderRadius: 6,
                                border: '1px solid #d1d5db',
                                backgroundColor: '#ffffff',
                                color: '#111827',
                                fontSize: 12,
                                cursor: 'pointer',
                                minWidth: 140
                              }}
                            >
                              <option value="">选择音色</option>
                              {voices.map((v) => (
                                <option key={v.voiceId} value={v.voiceId}>
                                  {voiceNotes[v.voiceId] ? `${voiceNotes[v.voiceId]} (${v.voiceId})` : v.voiceId}
                                </option>
                              ))}
                            </select>
                            {role.minimaxVoiceId && (
                              <button
                                type="button"
                                onClick={() => handleCopyVoiceId(role.minimaxVoiceId!)}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: 6,
                                  border: '1px solid #d1d5db',
                                  backgroundColor: '#ffffff',
                                  color: '#6b7280',
                                  fontSize: 11,
                                  cursor: 'pointer'
                                }}
                              >
                                复制
                              </button>
                            )}
                          </>
                        ) : (
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>请先拉取音色列表</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {message && activeTab === 'voice' && (
              <div
                style={{
                  marginTop: 12,
                  fontSize: 12,
                  color: message.startsWith('✅') ? '#059669' : message.startsWith('❌') ? '#dc2626' : '#059669',
                  padding: '8px 10px',
                  borderRadius: 8,
                  backgroundColor: message.startsWith('✅') ? '#f0fdf4' : message.startsWith('❌') ? '#fef2f2' : '#f0fdf4',
                  border: `1px solid ${message.startsWith('✅') ? '#86efac' : message.startsWith('❌') ? '#fecaca' : '#86efac'}`
                }}
              >
                {message}
              </div>
            )}
          </>
        )}
      </section>
            </div>
          </div>
  );
};
