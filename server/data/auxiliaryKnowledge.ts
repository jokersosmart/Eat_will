export type AuxiliaryKnowledgeEntry = {
  section: "目標與框架" | "人物與角色" | "場景" | "時機" | "話題與五局" | "實戰與長期養成";
  category: "研究補充";
  title: string;
  content: string;
  peopleTags: string;
  cuisineTags: string;
  timeTags: string;
  sourceName: string;
  sourceUrl: string;
  sourceScope: string;
  sortOrder: number;
};

export const auxiliaryKnowledgeEntries: AuxiliaryKnowledgeEntry[] = [
  {
    section: "目標與框架", category: "研究補充", title: "局前先分開寫：立場、利益與下一步",
    content: "把你想要的結果、想理解的對方利益、可交換資源與可接受的下一步分開寫。先探索利益與選項，再決定是否提出具體合作，不把一句表態當成共識。",
    peopleTags: "不限", cuisineTags: "不限", timeTags: "不限",
    sourceName: "Program on Negotiation at Harvard Law School｜What Is Negotiation?", sourceUrl: "https://www.pon.harvard.edu/daily/negotiation-skills-daily/what-is-negotiation/",
    sourceScope: "談判準備原則，不取代個別交易、法律或採購判斷。", sortOrder: 33,
  },
  {
    section: "目標與框架", category: "研究補充", title: "把下一步設計成可選擇的行動",
    content: "飯局結尾不要只說「再聯絡」。可提出低承諾、可拒絕的下一步，例如交換一頁背景資料、安排 30 分鐘深談，或確認由誰在何時回覆。",
    peopleTags: "不限", cuisineTags: "不限", timeTags: "不限",
    sourceName: "Harvard Business School Online｜How to Prepare for a Negotiation", sourceUrl: "https://online.hbs.edu/blog/post/how-to-prepare-for-a-negotiation",
    sourceScope: "用於把關係推進轉為可追蹤行動，不應把禮貌回應解讀為承諾。", sortOrder: 34,
  },
  {
    section: "人物與角色", category: "研究補充", title: "先聽行為，再命名角色",
    content: "角色判讀先看對方反覆帶回的議題、願意連結的人與對風險的反應；以開放問題與摘要確認理解，再決定是否把對方視為資源人、需求人或橋接人。",
    peopleTags: "不限", cuisineTags: "不限", timeTags: "不限",
    sourceName: "Center for Creative Leadership｜Active Listening Techniques", sourceUrl: "https://www.ccl.org/articles/leading-effectively-articles/coaching-others-use-active-listening-skills/",
    sourceScope: "七大角色仍以平台課程定義為準；不可由單次發言推定他人的私密動機。", sortOrder: 35,
  },
  {
    section: "人物與角色", category: "研究補充", title: "主持人先給不同意見留位置",
    content: "主持人可先說明「今天先交換理解，不急著下結論」，邀請不同觀點並示範承認未知。當出現分歧，先複述對方觀點，再提出自己的保留。",
    peopleTags: "3-4人|5-8人|10人以上", cuisineTags: "不限", timeTags: "不限",
    sourceName: "Harvard Business School Online｜How to Build Psychological Safety in the Workplace", sourceUrl: "https://online.hbs.edu/blog/post/psychological-safety-in-the-workplace",
    sourceScope: "心理安全感來自持續互動；單次飯局只能創造較尊重的討論條件，不能保證信任。", sortOrder: 36,
  },
  {
    section: "人物與角色", category: "研究補充", title: "橋接前先取得雙方的知情同意",
    content: "若要把兩位來賓連結，先說明你觀察到的共同點，詢問是否願意認識或由你協助引介；讓任一方都能自然婉拒。",
    peopleTags: "3-4人|5-8人|10人以上", cuisineTags: "不限", timeTags: "不限",
    sourceName: "Stanford Report｜The Strength of Weak Ties", sourceUrl: "https://news.stanford.edu/stories/2023/07/strength-weak-ties",
    sourceScope: "弱連結可帶來新資訊，但研究不支持未經同意的大量引介或交換聯絡方式。", sortOrder: 37,
  },
  {
    section: "場景", category: "研究補充", title: "菜色、酒水與座位先確認偏好，不替人假設",
    content: "邀約或入座前，以中性問題確認飲食限制、酒水意願、稱呼與溝通偏好；提供非酒精與可替代選項，避免以文化背景推定個人習慣。",
    peopleTags: "不限", cuisineTags: "不限", timeTags: "不限",
    sourceName: "Thunderbird School of Global Management｜Mastering Cross-Cultural Business", sourceUrl: "https://thunderbird.asu.edu/thought-leadership/insights/cross-cultural-business",
    sourceScope: "跨文化能力是觀察、提問與調整，不是背誦或套用任何群體的固定規則。", sortOrder: 38,
  },
  {
    section: "場景", category: "研究補充", title: "招待費用先過三個檢查：透明、合比例、合規",
    content: "安排餐敘前確認出席者公司規範、預算、付款與紀錄方式。若餐敘與採購、審核或公職決策有關，更應避免以招待交換承諾或造成義務感。",
    peopleTags: "不限", cuisineTags: "不限", timeTags: "不限",
    sourceName: "Transparency International UK｜Gifts & Hospitality", sourceUrl: "https://www.antibriberyguidance.org/guidance/9-gifts-hospitality/guidance",
    sourceScope: "為一般商務誠信提醒，不構成任何法域的法律意見；請以適用法律與組織政策為準。", sortOrder: 39,
  },
  {
    section: "時機", category: "研究補充", title: "在進場前就保留選擇與退出空間",
    content: "邀約可清楚交代目的、參與者與預估時間，並讓對方可選擇時間、形式或婉拒。明確的選擇權有助於把餐敘定位為交流，而非被迫表態。",
    peopleTags: "2人|3-4人|5-8人|10人以上", cuisineTags: "不限", timeTags: "早餐|午餐|下午茶|晚餐|宵夜",
    sourceName: "Harvard Business School Online｜How to Build Psychological Safety in the Workplace", sourceUrl: "https://online.hbs.edu/blog/post/psychological-safety-in-the-workplace",
    sourceScope: "心理安全感研究主要來自工作場域；此處僅轉化為尊重選擇權的邀約設計。", sortOrder: 40,
  },
  {
    section: "時機", category: "研究補充", title: "提案前先確認對方是否已準備好談下一步",
    content: "當對方開始主動描述限制、需求或可能合作方式，再詢問「現在適合一起看下一步，還是先把情況理解完整？」把推進權留給對方。",
    peopleTags: "2人|3-4人|5-8人", cuisineTags: "不限", timeTags: "午餐|下午茶|晚餐",
    sourceName: "Program on Negotiation at Harvard Law School｜A Negotiation Preparation Checklist", sourceUrl: "https://www.pon.harvard.edu/daily/negotiation-skills-daily/negotiation-preparation-checklist/",
    sourceScope: "可作為推進節奏的檢查點；若需要正式談判，應另行安排合適會議與必要決策者。", sortOrder: 41,
  },
  {
    section: "話題與五局", category: "研究補充", title: "探索時使用「一問、一反映、一確認」",
    content: "先問一個開放問題，接著用自己的話反映你聽到的重點，最後請對方確認或補充。例如：「我理解你現在最在意的是交付風險，對嗎？」",
    peopleTags: "不限", cuisineTags: "不限", timeTags: "不限",
    sourceName: "Center for Creative Leadership｜Active Listening Techniques", sourceUrl: "https://www.ccl.org/articles/leading-effectively-articles/coaching-others-use-active-listening-skills/",
    sourceScope: "反映用於確認理解，不能把推測的情緒、立場或未說出口的資訊當成事實。", sortOrder: 42,
  },
  {
    section: "話題與五局", category: "研究補充", title: "讓澄清問題比追問更有方向",
    content: "當故事資訊不足時，優先問「這對你們目前最難的是哪一段？」或「我有沒有漏掉重要條件？」再決定是否深入，不以連珠炮式問題逼對方交代。",
    peopleTags: "不限", cuisineTags: "不限", timeTags: "不限",
    sourceName: "NCBI Bookshelf｜Active Listening", sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK442015/",
    sourceScope: "適用於日常溝通的傾聽與澄清；不能用於逼問、蒐集敏感資訊或取代專業訪談。", sortOrder: 43,
  },
  {
    section: "話題與五局", category: "研究補充", title: "跨文化溝通先問後調整",
    content: "遇到不熟悉的稱呼、節奏或禮節時，先用開放問題確認偏好，並直接澄清誤解。用對方當下提供的訊息調整，不把國籍、語言或職稱當作行為預設。",
    peopleTags: "不限", cuisineTags: "不限", timeTags: "不限",
    sourceName: "Journal of Intelligence｜How Is Cultural Intelligence Related to Human Behavior?", sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8788423/",
    sourceScope: "文化智商是跨情境的適應能力；任何文化概括都不能取代對個人的尊重與確認。", sortOrder: 44,
  },
  {
    section: "實戰與長期養成", category: "研究補充", title: "局後追蹤先提供一項具體價值",
    content: "48 小時內只整理一個與對方目標直接相關的價值，例如補充資料、經同意的引介或可延續的問題；內容簡短，並給對方不回覆或稍後回覆的空間。",
    peopleTags: "不限", cuisineTags: "不限", timeTags: "不限",
    sourceName: "MIT Initiative on the Digital Economy｜New Study Proves That Weak Ties Have Strong Employment Value", sourceUrl: "https://ide.mit.edu/insights/new-study-proves-that-weak-ties-have-strong-employment-value/",
    sourceScope: "弱連結與資訊流動的研究不等於保證合作；避免無差別群發或把回覆率當作關係價值。", sortOrder: 45,
  },
  {
    section: "實戰與長期養成", category: "研究補充", title: "把弱連結維繫成低頻、高相關的節點",
    content: "建立追蹤紀錄時，標記對方關心的議題、你承諾的下一步與最後一次互動。只在有相關資訊或可提供幫助時聯繫，不以頻率壓力取代關係品質。",
    peopleTags: "不限", cuisineTags: "不限", timeTags: "不限",
    sourceName: "Stanford Report｜The Strength of Weak Ties", sourceUrl: "https://news.stanford.edu/stories/2023/07/strength-weak-ties",
    sourceScope: "弱連結有其價值，但不應被量化為可操控的人脈名單；資料記錄須尊重隱私與同意。", sortOrder: 46,
  },
  {
    section: "實戰與長期養成", category: "研究補充", title: "復盤時把事實、解讀與下一步分欄記錄",
    content: "飯後先寫下可觀察的事實，再分開記錄自己的解讀與下一次要確認的問題。這能降低把一次飯局的感受誤寫成對他人意圖的定論。",
    peopleTags: "不限", cuisineTags: "不限", timeTags: "不限",
    sourceName: "Journal of Intelligence｜Cultural Intelligence: What Is It and How Can It Effectively Be Measured?", sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9396990/",
    sourceScope: "此條目著重反思與情境調整；不是心理評估工具，也不能從有限互動診斷他人。", sortOrder: 47,
  },
];
