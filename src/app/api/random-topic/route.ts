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
        content: `随机生成一个讨论场景。返回 JSON：
\`\`\`json
{
  "crowdDescription": "参与讨论的人群特征（20-40字，简洁平实）",
  "topic": "讨论话题（15字以内）"
}
\`\`\`
${hotContext}
## 话题方向
${categoryHint}
${hotTopics.length > 0 ? '可以结合上面的热搜' : ''}

## 要求
- 话题要有观点分歧，不同立场的人能聊出不同看法
- 人群描述要像产品调研里的目标用户画像，平实准确，不要文学化
- 不要夸张修辞、不要抖机灵、不要写段子
- 不要出现"一群""几个"等数量词
- 人群和话题之间要有相关性——这些人对这个话题确实有切身体会

示例格式（参考语气，不要照抄内容）：
- 人群：二三线城市 25-35 岁的小店主，做餐饮或零售，有的刚开店有的干了好几年
- 人群：互联网公司工作 3-8 年的产品和运营，经历过裁员或目睹同事被裁
- 人群：30-45 岁有小孩的双职工家庭，在考虑教育投入和生活质量的平衡
- 人群：刚毕业一两年的年轻人，有的在大城市租房，有的回了老家

直接返回 JSON。`,
      }],
      { temperature: 0.9, maxTokens: 256 }
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
