import type { HerStartAnalysis, FollowupQuestion } from "./schema";

export const demoFollowup: FollowupQuestion = {
  question: "你提到经常帮别人梳理副业方向，最近一次是谁找你？她具体卡在哪里？",
  missingReason: "缺少一个真实的案例细节，无法判断她解决的具体问题类型。",
};

export const demoAnalysis: HerStartAnalysis = {
  facts: ["拥有10年以上互联网医疗运营经验", "擅长把复杂经验整理成SOP", "希望线上、低成本开始并兼顾家庭"],
  lifeAssetCard: {
    assets: [
      { name: "医疗项目运营", source: "长期参与医生资源拓展与项目运营", formedAbility: "跨角色协调与项目推进", transferableValue: "帮助小团队梳理可执行的运营流程", factEvidence: "10年以上互联网医疗运营经验" },
      { name: "经验产品化", source: "反复把复杂工作整理成SOP", formedAbility: "结构化拆解与标准化", transferableValue: "把隐性经验转成模板、清单和陪练", factEvidence: "擅长将复杂经验整理成SOP" },
      { name: "陪伴式梳理", source: "经常帮助他人梳理副业方向和知识库", formedAbility: "倾听、提问与路径设计", transferableValue: "为转型女性提供轻量诊断", factEvidence: "他人会主动寻求其副业与AI实践建议" },
    ],
    coreTransferableAbility: "把复杂经验梳理成普通人能执行的清晰路径",
    valuePositioning: "帮助有专业积累但方向模糊的女性，把经验整理成可验证的第一个服务产品。",
  },
  minimumProductCard: {
    primaryPath: "一对一人生资产与最小产品诊断",
    alternativePaths: ["经验产品化模板包", "4人小型工作坊"],
    targetUser: "有5年以上工作经验、想开启第二收入曲线但不知道卖什么的女性",
    problem: "经验很多，却无法提炼出清晰的付费问题与低成本交付物",
    productName: "90分钟人生资产开局诊断",
    delivery: "线上访谈 + 一页资产地图 + 一个最小产品草案",
    testPrice: "建议测试价格：199—399元/次",
    paymentReason: "能减少盲目学习和方向试错，直接带走可测试的产品雏形",
    firstCustomers: "曾向你咨询过职业转型、副业方向或AI实践的熟人",
    validationNote: "目标用户是否愿意为诊断付费、价格与交付深度均需通过真实访谈和预售验证。",
  },
  actionCard: {
    actions: [
      { task: "列出5位曾向你请教相关问题的人", estimatedMinutes: 10, completionCriteria: "写下5个真实名字和她们的问题", realUserContact: false },
      { task: "向其中2人发送产品访谈邀请", estimatedMinutes: 20, completionCriteria: "完成2次一对一私信并获得至少1条回复", realUserContact: true },
      { task: "写出一版不超过100字的服务说明", estimatedMinutes: 20, completionCriteria: "包含目标用户、问题、交付和建议测试价格", realUserContact: false },
    ],
    badge: "开局行动者",
  },
  assumptions: ["用户愿意为结构化诊断而非泛建议付费", "熟人圈中存在首批访谈对象"],
  closing: "你不是缺少价值，而是还没有把自己的人生资产重新组织成别人愿意购买的价值。今天，我们完成了第一步。",
};
