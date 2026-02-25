// 简单的内存存储，用于 demo：在同一个无服务器实例里共享最近一次订阅
// 注意：多实例 / 冷启动下会丢失，这是正常现象，只用于你现在测试推送链路
let latestSubscription = null;

module.exports = {
  getLatest() {
    return latestSubscription;
  },
  setLatest(sub) {
    latestSubscription = sub;
  }
};


