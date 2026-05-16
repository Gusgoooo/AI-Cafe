import { chatCompletionJSON } from '@/lib/openrouter'

interface RandomTopic {
  crowdDescription: string
  topic: string
}

interface HotItem {
  title: string
  hotValue: string
}

async function fetchHotSearch(): Promise<string[]> {
  try {
    const res = await fetch('https://api.codelife.cc/api/top/list?lang=cn&id=KqndgxeLl9', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return []
    const json = await res.json()
    if (json.code !== 200 || !Array.isArray(json.data)) return []
    return (json.data as HotItem[]).slice(0, 30).map(item => item.title)
  } catch {
    return []
  }
}

export async function GET() {
  try {
    const hotTopics = await fetchHotSearch()

    const hotContext = hotTopics.length > 0
      ? `\n## 当前实时热搜（${new Date().toLocaleDateString('zh-CN')}）
${hotTopics.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n`
      : ''

    const categoryRoll = Math.random()
    let categoryHint: string
    if (categoryRoll < 0.3) {
      categoryHint = '这次生成电商/消费/商业方向的话题（直播带货、种草拔草、品牌翻车、平台大战、退货经济、冲动消费、二手交易、会员割韭菜等）'
    } else if (categoryRoll < 0.55) {
      categoryHint = '这次生成社会/人生方向的话题（代际冲突、婚恋观、生育选择、阶层流动、小镇做题家、海归贬值、中年危机、老龄化、考公考编等）'
    } else if (categoryRoll < 0.75) {
      categoryHint = '这次生成科技/文化方向的话题（AI替代焦虑、短视频成瘾、信息茧房、游戏氪金、虚拟偶像、知识付费、开源vs闭源、远程办公等）'
    } else {
      categoryHint = '这次生成一个非常奇特和意想不到的话题方向（养生玄学、玄学消费、宠物经济、殡葬行业、灵活就业、摆烂哲学、数字游民、盗版正版之争、考古盲盒、寺庙经济、彩票心理学、AI恋爱等）'
    }

    const result = await chatCompletionJSON<RandomTopic>(
      [{
        role: 'user',
        content: `随机生成一个有趣的讨论场景。返回 JSON：
\`\`\`json
{
  "crowdDescription": "这群人的特征描述（40-80字）",
  "topic": "一个有争议性的讨论话题（20字以内）"
}
\`\`\`
${hotContext}
## 话题方向
${categoryHint}
${hotTopics.length > 0 ? '可以结合上面的热搜' : ''}
话题必须有争议性，能让不同人吵起来。不要温和的讨论题，要那种一说出来就有人跳脚的。

## 人群要求——越发散越好，禁止重复以下类型
禁止再生成：都市白领/互联网人/程序员/新中产妈妈/Z世代大学生。这些已经用烂了。

从以下池子里随机挑一个方向（或自创更离谱的）：
身份池：退伍军人、殡葬师、代驾司机、酒吧调酒师、三甲医院护士、幼儿园老师、地铁安检员、房产中介、外卖站长、监狱管教、快递分拣工、直播间场控、相声演员、寺庙住持、算命先生、电竞陪练、宠物殡葬师、剧本杀编剧、密室逃脱设计师、专利审查员、地质勘探队员、马戏团驯兽师、古建筑修复师、法医、催收员、月嫂、代购、黄牛、保安队长、驾校教练、废品回收站老板

地域池：东北县城、西南边境、长三角工厂区、西北油田、海南免税区、义乌小商品城、中缅边境、藏区牧场、广州城中村、温州商会

状态池：刚失业的、准备移民的、在考虑转行的、负债中的、意外暴富的、刚离婚的、正在gap year的、被裁员的、创业失败第三次的、刚买房被套牢的

要求：
- 人群描述要画面感极强，让人一读就能想象出这群人的样子
- 不要出现"一群""几个"等数量词
- 人群和话题之间要有张力——这群人讨论这个话题为什么特别有意思

示例（参考发散度，绝对不要照抄）：
- 义乌小商品城里做了二十年假发生意的浙江老板娘们，把全世界的头顶都摸透了，但自己从来不戴假发
- 凌晨四点收摊的烧烤师傅，纹着花臂但其实是会计专业毕业的，每天和醉鬼打交道比和家人说的话都多
- 刚拿到绿卡就后悔的985海归，发现美国超市的菜比老家菜市场贵三倍，而且没有蒜薹
- 在三甲医院急诊科干了十年的护士，见过太多半夜送来的人，现在看谁都觉得要注意身体
- 景德镇漂了五年的陶瓷手艺人，作品卖不出去就去摆地摊，摆地摊反而卖得比画廊好
- 每天开12小时网约车的前金融从业者，后座聊天听到的八卦比彭博终端信息还多
- 在鹤岗买了三套房的90后自由职业者，全网最便宜的房东，但冬天取暖费比房贷还贵
- 藏区牧场养了两百头牦牛的藏族小伙，虫草季比基金经理还忙，淡季在拉萨当摩的司机

直接返回 JSON。`,
      }],
      { temperature: 1.3, maxTokens: 512 }
    )

    return Response.json(result)
  } catch (err) {
    console.error('随机话题生成失败:', err)
    return Response.json(
      { error: '生成失败' },
      { status: 500 }
    )
  }
}
