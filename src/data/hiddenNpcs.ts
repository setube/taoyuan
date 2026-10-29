import type { HiddenNpcDef } from '@/types/hiddenNpc'

/** 所有隐藏NPC（仙灵）定义 */
export const HIDDEN_NPCS: HiddenNpcDef[] = [
  // ============================================================
  // 1. 龙灵 — 潜渊龙灵
  // ============================================================
  {
    id: 'long_ling',
    name: '龙灵',
    trueName: '沧澜',
    gender: 'female',
    title: '潜渊龙灵',
    origin: '千年潜伏于后山瀑布深潭的翠色灵龙，传说桃源乡建村之初便已栖于此处。雨中偶现鳞光，被村民视为守护灵。',
    personality: '沉静深邃、古朴庄重',
    discoverySteps: [
      {
        id: 'long_ling_rumor',
        phase: 'rumor',
        conditions: [{ type: 'fishCaught', fishId: 'jade_dragon' }],
        scenes: [
          {
            text: '你仔细端详手中的翠龙鱼，鳞片在雨中泛着不寻常的光泽。一个念头掠过脑海——这真的只是一条鱼吗？'
          },
          { text: '远处的瀑布传来低沉的轰鸣，其中似乎夹杂着某种……呼唤。' }
        ],
        logMessage: '【仙缘】翠龙鱼的鳞片泛起异样光泽，瀑布深处似有灵息涌动……'
      },
      {
        id: 'long_ling_glimpse',
        phase: 'glimpse',
        conditions: [
          { type: 'season', season: 'spring' },
          { type: 'weather', weather: 'rainy' },
          { type: 'timeRange', minHour: 20, maxHour: 24 },
          { type: 'location', panel: 'fishing' }
        ],
        scenes: [
          {
            text: '春雨淅沥的夜晚，你独自在瀑布边垂钓。水面上突然泛起层层涟漪。'
          },
          {
            text: '一道翠色的蛇形身影在瀑布帘幕后一闪而过，鳞光如碎玉洒落水面。'
          },
          {
            text: '你揉了揉眼睛，水面已恢复平静。但空气中残留着淡淡的龙涎香气。'
          }
        ],
        logMessage: '【仙缘】春雨夜的瀑布中，一道翠色身影一闪而逝……'
      },
      {
        id: 'long_ling_encounter',
        phase: 'encounter',
        conditions: [
          { type: 'season', season: 'spring' },
          { type: 'weather', weather: 'rainy' },
          { type: 'location', panel: 'fishing' },
          { type: 'item', itemId: 'dragon_jade', quantity: 1 }
        ],
        scenes: [
          {
            text: '你手持龙玉来到瀑布前。玉石突然散发出柔和的翠光，与瀑布中的某种力量遥相呼应。'
          },
          {
            text: '瀑布缓缓分开，水帘后走出一名青衣女子。她的长发如瀑般垂落，眼瞳是深邃的翠绿色。'
          },
          {
            text: '「持玉者……你有何所求？」她的声音如流水般清冽，带着千年的沉淀。',
            choices: [
              {
                text: '我只是循着感召而来。',
                friendshipChange: 80,
                response: '她微微颔首：「纯粹之心，甚好。」翠色瞳孔中闪过一丝温柔。'
              },
              {
                text: '请问……你是传说中的龙灵？',
                friendshipChange: 40,
                response: '「龙灵？那是凡人的称呼。吾名沧澜。」她淡淡说道，语气中不见冒犯。'
              },
              {
                text: '这块龙玉是你的吗？',
                friendshipChange: 60,
                response: '她伸手轻触玉石，指尖泛起涟漪：「此物与吾有缘。持有它的人……也是。」'
              }
            ]
          },
          {
            text: '话毕，她的身影化作水雾消散在瀑布间。但你知道，她还会再出现。'
          }
        ],
        logMessage: '【仙缘】瀑布水帘后，龙灵沧澜初次现身。'
      },
      {
        id: 'long_ling_revealed',
        phase: 'revealed',
        conditions: [
          { type: 'questComplete', questId: 'main_2_4' },
          { type: 'skill', skillType: 'fishing', minLevel: 5 }
        ],
        scenes: [
          { text: '当你再次来到瀑布前时，龙灵已在水边等候。' },
          {
            text: '「你的执念……不，是诚意，打动了吾。」她微微侧头，长发间露出细小的翠色鳞片。'
          },
          { text: '「吾名沧澜。此后，你若有心相见，来此处便可。」' }
        ],
        logMessage: '【仙缘】龙灵沧澜愿意与你往来了。'
      }
    ],
    resonantOfferings: ['dragon_jade', 'prismatic_shard', 'moonstone'],
    pleasedOfferings: ['jade_dragon', 'ruby', 'jade', 'obsidian', 'quartz'],
    repelledOfferings: ['charcoal', 'trash', 'wood'],
    dialogues: {
      wary: ['「凡人……不要太靠近。」', '「瀑布深处并非你该来的地方。」'],
      curious: ['「你又来了……倒是有趣。」', '「这里的水最近清澈了许多，是你在照料溪流吗？」'],
      trusting: ['「{player}，今日的雨声很好听。」', '「和你在水边坐着，时光仿佛回到了千年前。」'],
      devoted: ['「你是千年来第一个让吾愿意等待的凡人。」', '「{player}……吾已不想再回到深渊了。」'],
      eternal: ['「沧澜之名，只告诉过你一人。」', '「天地之间，唯你与吾，便是桃源。」']
    },
    interactionType: 'meditation',
    bondable: true,
    courtshipItemId: 'dragon_scale_charm',
    bondItemId: 'dragon_pearl',
    courtshipThreshold: 1800,
    bondThreshold: 2500,
    heartEventIds: ['long_ling_heart_1', 'long_ling_heart_2', 'long_ling_heart_3'],
    courtshipDialogues: [
      '「你将龙鳞佩交给吾……吾明白了。」她的面颊泛起淡淡的翠色红晕。',
      '「凡人的心意，吾虽不懂，却……不讨厌。」',
      '「{player}，今日可以多坐一会儿吗？」'
    ],
    courtshipCraftCost: [
      { itemId: 'dragon_jade', quantity: 5 },
      { itemId: 'moonstone', quantity: 8 },
      { itemId: 'gold_bar', quantity: 5 }
    ],
    bondCraftCost: [
      { itemId: 'dragon_jade', quantity: 8 },
      { itemId: 'prismatic_shard', quantity: 5 },
      { itemId: 'moonstone', quantity: 10 },
      { itemId: 'gold_bar', quantity: 8 }
    ],
    bondBonuses: [
      { type: 'weather_control', chance: 0.3 },
      { type: 'fish_attraction', chance: 0.5 }
    ],
    bondHorseBreed: 'divine',
    abilities: [
      {
        id: 'long_ling_1',
        affinityRequired: 800,
        name: '龙泽',
        description: '瀑布钓鱼品质提升一级',
        passive: { type: 'quality_boost', value: 1 }
      },
      {
        id: 'long_ling_2',
        affinityRequired: 1500,
        name: '唤雨',
        description: '下雨概率+15%',
        passive: { type: 'luck', value: 15 }
      },
      {
        id: 'long_ling_3',
        affinityRequired: 2200,
        name: '龙瞳',
        description: '传说鱼捕获率+20%',
        passive: { type: 'luck', value: 20 }
      }
    ],
    manifestationDay: { season: 'spring', day: 14 }
  },

  // ============================================================
  // 2. 桃夭 — 桃林花灵
  // ============================================================
  {
    id: 'tao_yao',
    name: '桃夭',
    trueName: '灼华',
    gender: 'female',
    title: '桃林花灵',
    origin: '诞生于桃源乡最古老桃树的花精，以落瓣为衣，以晨露为饮。据说桃源乡之所以叫"桃源"，便因她在此守护。',
    personality: '活泼灵动、天真烂漫',
    discoverySteps: [
      {
        id: 'tao_yao_rumor',
        phase: 'rumor',
        conditions: [{ type: 'skill', skillType: 'farming', minLevel: 4 }],
        scenes: [
          { text: '清晨在农场劳作时，一阵不合时节的桃花瓣飘过你的面前。' },
          { text: '花瓣中似乎传来极细微的笑声，轻灵得如同风铃。' }
        ],
        logMessage: '【仙缘】桃花瓣中似有轻语，是风的错觉吗……'
      },
      {
        id: 'tao_yao_glimpse',
        phase: 'glimpse',
        conditions: [
          { type: 'season', season: 'spring' },
          { type: 'timeRange', minHour: 6, maxHour: 8 },
          { type: 'location', panel: 'farm' }
        ],
        scenes: [
          {
            text: '春日清晨，晨雾尚未散去。你在果树间看到一个纤细的身影，正伸手抚摸桃树的枝干。'
          },
          {
            text: '她似乎察觉到了你的视线，回头望了一眼——一张花瓣般精致的脸庞，转瞬化作漫天飞花消失不见。'
          }
        ],
        logMessage: '【仙缘】晨雾中的果树旁，花瓣飘舞的幻影一闪而逝。'
      },
      {
        id: 'tao_yao_encounter',
        phase: 'encounter',
        conditions: [
          { type: 'item', itemId: 'peach', quantity: 1 },
          { type: 'item', itemId: 'honey', quantity: 1 },
          { type: 'day', day: 14 }
        ],
        scenes: [
          {
            text: '满月之夜，你带着桃子和蜂蜜来到最大的桃树下。月光洒落枝头，花瓣无风自舞。'
          },
          {
            text: '一个少女从树干中走出，肌肤白皙如花瓣，发间簪着一朵永不凋零的桃花。'
          },
          {
            text: '「嘻嘻，终于来了呀！」她笑嘻嘻地说，「我闻到甜甜的味道，是给我的吗？」',
            choices: [
              {
                text: '是的，这是给你的礼物。',
                friendshipChange: 80,
                response: '她欢呼一声接过桃子和蜂蜜：「太好啦！我最喜欢甜的东西了！」'
              },
              {
                text: '你是……桃树精？',
                friendshipChange: 40,
                response: '「花灵啦！桃林花灵！」她鼓起腮帮子纠正道，「叫桃夭就好。」'
              },
              {
                text: '你一直在看着我种田吗？',
                friendshipChange: 60,
                response: '她羞涩地别过头：「才、才没有一直看……只是偶尔啦。你种地很认真呢。」'
              }
            ]
          },
          { text: '月光渐淡，桃夭化作花瓣飘散：「下次满月，还来找我玩哦！」' }
        ],
        logMessage: '【仙缘】满月桃树下，花灵桃夭初次现身。'
      },
      {
        id: 'tao_yao_revealed',
        phase: 'revealed',
        conditions: [
          { type: 'questComplete', questId: 'main_1_5' },
          { type: 'skill', skillType: 'farming', minLevel: 5 }
        ],
        scenes: [
          { text: '当你走进农场时，桃夭已经坐在树枝上荡着腿等你了。' },
          {
            text: '「我想好啦！」她跳下树，裙摆扬起一片花瓣，「我叫灼华，是这片桃林的守护灵。」'
          },
          {
            text: '「以后你什么时候来，我都在哦！」她的笑容灿烂得像春天本身。'
          }
        ],
        logMessage: '【仙缘】桃林花灵灼华愿意与你往来了。'
      }
    ],
    resonantOfferings: ['peach', 'osmanthus', 'honey'],
    pleasedOfferings: ['chrysanthemum', 'tea', 'green_tea_drink', 'osmanthus_wine', 'peach_wine'],
    repelledOfferings: ['charcoal', 'iron_ore', 'copper_ore'],
    dialogues: {
      wary: ['「你是谁呀……不要碰桃树！」', '「哼，人类都只会砍树……」'],
      curious: ['「你每天都来浇水呢，真勤快！」', '「嘻嘻，你头上沾了片叶子。」'],
      trusting: ['「{player}，今天的阳光好舒服呀～」', '「和你在一起的时候，花开得特别好呢。」'],
      devoted: ['「{player}……你知道吗，花灵本不该对人动心的。」', '「可是一想到你，花就自己开了。」'],
      eternal: ['「灼华只为你一人绽放。」', '「千年万年，只要这片桃林在，我就在你身边。」']
    },
    interactionType: 'ritual',
    bondable: true,
    courtshipItemId: 'blossom_crown',
    bondItemId: 'eternal_blossom',
    courtshipThreshold: 1800,
    bondThreshold: 2500,
    heartEventIds: ['tao_yao_heart_1', 'tao_yao_heart_2', 'tao_yao_heart_3'],
    courtshipDialogues: [
      '桃夭接过花冠，红着脸戴在头上：「这是……求缘的意思吗？」',
      '「{player}，今天有只蝴蝶停在你肩上，一定是好兆头！」',
      '「我偷偷在你的桃树上施了法，明天会结出最甜的果子哦。」'
    ],
    courtshipCraftCost: [
      { itemId: 'peach', quantity: 25 },
      { itemId: 'honey', quantity: 15 },
      { itemId: 'osmanthus', quantity: 15 },
      { itemId: 'jade', quantity: 5 }
    ],
    bondCraftCost: [
      { itemId: 'peach', quantity: 50 },
      { itemId: 'honey', quantity: 25 },
      { itemId: 'chrysanthemum', quantity: 25 },
      { itemId: 'prismatic_shard', quantity: 3 },
      { itemId: 'moonstone', quantity: 8 }
    ],
    bondBonuses: [{ type: 'crop_blessing', chance: 0.2 }],
    abilities: [
      {
        id: 'tao_yao_1',
        affinityRequired: 600,
        name: '花泽',
        description: '果树每次+1产量',
        passive: { type: 'quality_boost', value: 1 }
      },
      {
        id: 'tao_yao_2',
        affinityRequired: 1200,
        name: '春息',
        description: '春季作物生长快15%',
        passive: { type: 'exp_boost', value: 15 }
      },
      {
        id: 'tao_yao_3',
        affinityRequired: 2000,
        name: '灵桃',
        description: '桃树概率产出灵桃',
        passive: { type: 'luck', value: 10 }
      }
    ],
    manifestationDay: { season: 'spring', day: 3 }
  },

  // ============================================================
  // 3. 月兔 — 捣药玉兔
  // ============================================================
  {
    id: 'yue_tu',
    name: '月兔',
    trueName: '素问',
    gender: 'female',
    title: '捣药玉兔',
    origin: '从月宫偷溜下凡的玉兔，化为兔耳少女，随身携带一把玉杵。据说月宫的药材她已捣完，无聊至极才来人间。',
    personality: '好奇活泼、贪吃药草',
    discoverySteps: [
      {
        id: 'yue_tu_rumor',
        phase: 'rumor',
        conditions: [{ type: 'skill', skillType: 'foraging', minLevel: 7 }],
        scenes: [
          {
            text: '你的采集技艺已臻化境。今天采药时发现一块造型奇特的玉石碎片，像是某种器具的一部分。'
          },
          { text: '碎片在月光下泛着银白色的光，上面隐约刻着一只兔子的纹样。' }
        ],
        logMessage: '【仙缘】采药时发现一块玉杵残片，上刻兔纹，月光下莹莹生辉……'
      },
      {
        id: 'yue_tu_glimpse',
        phase: 'glimpse',
        conditions: [
          { type: 'day', day: 14 },
          { type: 'timeRange', minHour: 20, maxHour: 24 },
          { type: 'weather', weather: 'sunny' },
          { type: 'location', panel: 'forage' }
        ],
        scenes: [
          {
            text: '满月之夜，月华如银洒满竹林。你听到远处传来"咚、咚、咚"的有节奏的声响。'
          },
          {
            text: '循声望去，月光下一个白色的小小身影正在捣弄什么。她头顶两只长长的耳朵一跳一跳的。'
          },
          {
            text: '似乎察觉到你的目光，那身影"嗖"地消失在竹林深处，只留下几片散落的药草。'
          }
        ],
        logMessage: '【仙缘】满月竹林中，白影一闪，药草散落一地。'
      },
      {
        id: 'yue_tu_encounter',
        phase: 'encounter',
        conditions: [
          { type: 'item', itemId: 'ginseng', quantity: 1 },
          { type: 'item', itemId: 'herb', quantity: 5 },
          { type: 'location', panel: 'forage' }
        ],
        scenes: [
          {
            text: '你带着人参和草药来到竹林。刚放下草药，一个声音从头顶传来——'
          },
          {
            text: '「人参！是人参！」一个兔耳少女从竹子上跳下来，眼睛亮晶晶地盯着你手中的药材。'
          },
          {
            text: '「给、给我嘛！月宫的药我都捣腻了，人间的草药才好闻！」她伸出手，尾巴兴奋地摇个不停。',
            choices: [
              {
                text: '都给你。',
                friendshipChange: 80,
                response: '「真的吗！你是好人！」她抱着草药转了个圈，「我叫月兔，以后我帮你捣药！」'
              },
              {
                text: '你从月宫来的？',
                friendshipChange: 40,
                response: '「嘘——！」她慌张地竖起一根手指，「别告诉嫦娥姐姐！我偷跑出来的！」'
              },
              {
                text: '你要用这些做什么？',
                friendshipChange: 60,
                response: '「捣药呀！把草药捣成粉，能治好多病呢。」她晃了晃手中的玉杵，得意地笑。'
              }
            ]
          },
          {
            text: '月兔抱着草药蹦蹦跳跳地消失在月光中，空气里留下淡淡的药香。'
          }
        ],
        logMessage: '【仙缘】竹林中邂逅了从月宫偷溜下凡的玉兔。'
      },
      {
        id: 'yue_tu_revealed',
        phase: 'revealed',
        conditions: [
          { type: 'questComplete', questId: 'main_2_4' },
          { type: 'skill', skillType: 'foraging', minLevel: 7 }
        ],
        scenes: [
          { text: '你再次来到竹林，月兔正坐在石头上，面前摆着一排小药瓶。' },
          {
            text: '「啊！你来啦！」她高兴地跳起来，耳朵一抖一抖，「我叫素问，是月宫的捣药玉兔。」'
          },
          {
            text: '「嫦娥姐姐说人间不好玩，才不是呢！这里有好多好闻的草药，还有你！」'
          }
        ],
        logMessage: '【仙缘】月兔素问决定留在桃源乡了。'
      }
    ],
    resonantOfferings: ['ginseng', 'herb', 'tea', 'green_tea_drink'],
    pleasedOfferings: ['wild_mushroom', 'truffle', 'chrysanthemum', 'osmanthus_wine'],
    repelledOfferings: ['quartz', 'charcoal', 'trash'],
    dialogues: {
      wary: ['「别、别靠近！我有玉杵的！」', '「你是来抓我回月宫的吗……」'],
      curious: ['「你身上有好多草药的味道！」', '「这朵花是什么呀？好香！」'],
      trusting: ['「{player}，今天我捣了一种新药，要尝尝吗？」', '「和你采药最开心了，不用一个人闷头捣。」'],
      devoted: ['「{player}……就算嫦娥姐姐来接我，我也不想回去了。」', '「月宫再美，也没有你呀。」'],
      eternal: ['「素问这辈子，只给{player}一个人捣药。」', '「你是我的人间，比月亮还亮。」']
    },
    interactionType: 'music',
    bondable: true,
    courtshipItemId: 'jade_mortar',
    bondItemId: 'moon_elixir',
    courtshipThreshold: 1800,
    bondThreshold: 2500,
    heartEventIds: ['yue_tu_heart_1', 'yue_tu_heart_2', 'yue_tu_heart_3'],
    courtshipDialogues: [
      '月兔接过玉杵，耳朵瞬间红透了：「这、这是……嗯，我收下了。」',
      '「{player}，我做了新的草药丸子，味道可好了，你一定要尝！」',
      '「和你一起看月亮的时候，不会想念月宫了呢。」'
    ],
    courtshipCraftCost: [
      { itemId: 'moonstone', quantity: 8 },
      { itemId: 'jade', quantity: 5 },
      { itemId: 'ginseng', quantity: 5 },
      { itemId: 'herb', quantity: 50 }
    ],
    bondCraftCost: [
      { itemId: 'ginseng', quantity: 10 },
      { itemId: 'snow_lotus', quantity: 8 },
      { itemId: 'moonstone', quantity: 10 },
      { itemId: 'prismatic_shard', quantity: 3 }
    ],
    bondBonuses: [{ type: 'stamina_restore', amount: 15 }],
    abilities: [
      {
        id: 'yue_tu_1',
        affinityRequired: 500,
        name: '灵采',
        description: '草药采集数量翻倍',
        passive: { type: 'quality_boost', value: 2 }
      },
      {
        id: 'yue_tu_2',
        affinityRequired: 1000,
        name: '药引',
        description: '茶与药的效果+50%',
        passive: { type: 'exp_boost', value: 50 }
      },
      {
        id: 'yue_tu_3',
        affinityRequired: 1800,
        name: '月华',
        description: '采集概率获得月草',
        passive: { type: 'luck', value: 8 }
      }
    ],
    manifestationDay: { season: 'autumn', day: 14 }
  },

  // ============================================================
  // 4. 狐仙 — 九尾灵狐
  // ============================================================
  {
    id: 'hu_xian',
    name: '狐仙',
    trueName: '无名',
    gender: 'male',
    title: '九尾灵狐',
    origin: '修炼千年的狐狸精，亦正亦邪。他善于幻术与变化，常化作不同模样在人间游荡，偏爱收集奇珍异宝。',
    personality: '狡黠风趣、亦正亦邪',
    discoverySteps: [
      {
        id: 'hu_xian_rumor',
        phase: 'rumor',
        conditions: [{ type: 'money', minAmount: 100000 }],
        scenes: [
          { text: '今早门前多了一封没有署名的信笺，上面只写了一句话——' },
          { text: '「黄昏时分，往人多的地方走走吧。有趣的事正在等着你。」' },
          { text: '信笺翻过来，背面画着一只似笑非笑的狐狸。' }
        ],
        logMessage: '【仙缘】收到一封神秘信笺，画着一只狐狸……'
      },
      {
        id: 'hu_xian_glimpse',
        phase: 'glimpse',
        conditions: [
          { type: 'timeRange', minHour: 17, maxHour: 19 },
          { type: 'location', panel: 'village' }
        ],
        scenes: [
          { text: '黄昏时分，你在村中散步。余晖将一切染成金色。' },
          {
            text: '人群中有一个陌生的青年，容貌俊美得不像凡人，嘴角挂着意味深长的笑。'
          },
          {
            text: '你想走近看清，但他已经消失了。只有一粒晶莹的红色珠子落在他站过的地方。'
          }
        ],
        logMessage: '【仙缘】黄昏村中，一个陌生的美男子一闪而逝。'
      },
      {
        id: 'hu_xian_encounter',
        phase: 'encounter',
        conditions: [
          { type: 'item', itemId: 'ruby', quantity: 1 },
          { type: 'item', itemId: 'jade', quantity: 1 }
        ],
        scenes: [
          { text: '你带着宝石来到村口。那个青年突然出现在你身后——' },
          {
            text: '「哟，被你找到了。」他笑着打了个响指，身后浮现出九条蓬松的尾巴。'
          },
          {
            text: '「来，回答我三个问题。答对了，就让你见识真正的狐仙。」他竖起三根手指。\n「第一问：什么东西越分越多？」',
            choices: [
              {
                text: '快乐。',
                friendshipChange: 80,
                response: '「不错不错，有灵性。」他满意地点头，一条尾巴亮了起来。'
              },
              {
                text: '金子？',
                friendshipChange: 20,
                response: '「庸俗。」他摇头叹气，但还是给了你一次机会。'
              },
              {
                text: '烦恼。',
                friendshipChange: 40,
                response: '「嗯……也算对。但吾更喜欢乐观的答案。」'
              }
            ]
          },
          {
            text: '「有意思。」他收起尾巴，化作一个普通青年的模样。「你比我想象中有趣。后会有期。」'
          }
        ],
        logMessage: '【仙缘】谜语挑战之后，狐仙终于露出真容。'
      },
      {
        id: 'hu_xian_revealed',
        phase: 'revealed',
        conditions: [
          { type: 'mineFloor', minFloor: 50 },
          { type: 'item', itemId: 'fox_bead', quantity: 1 }
        ],
        scenes: [
          {
            text: '你带着在矿洞深处找到的狐珠回到村中。那个青年已经靠在树上等着了。'
          },
          { text: '「你找到了我的狐珠。」他伸手接过，珠子在掌中闪耀赤光。' },
          {
            text: '「看来缘分天定。吾乃灵狐一族，你可以叫我……狐仙就好。真名？那可要再多了解一些才会告诉你哦。」'
          }
        ],
        logMessage: '【仙缘】归还狐珠后，狐仙愿意与你往来了。'
      }
    ],
    resonantOfferings: ['prismatic_shard', 'ruby', 'jade'],
    pleasedOfferings: ['obsidian', 'gold_ore', 'peach_wine', 'jujube_wine'],
    repelledOfferings: ['quartz', 'wood', 'bamboo'],
    dialogues: {
      wary: ['「别以为随便一个凡人都能见到狐仙。」', '「你的运气不错，但仅此而已。」'],
      curious: ['「你今天做了什么有趣的事？说来听听。」', '「这世间最无聊的就是一成不变，你可别让我失望。」'],
      trusting: ['「{player}，你是个有趣的人类。」', '「要不要看我变个戏法？」他指尖窜起一小簇狐火。'],
      devoted: ['「千年来，吾从不为一个人停留。你是第一个。」', '「{player}……你让吾想起了还是小狐狸时的自己，纯粹而赤诚。」'],
      eternal: ['「吾之真名，只在你耳边说过。」', '「九尾之下，只护你一人。」']
    },
    interactionType: 'dreamwalk',
    bondable: true,
    courtshipItemId: 'fox_flame_lantern',
    bondItemId: 'fox_spirit_bead',
    courtshipThreshold: 1800,
    bondThreshold: 2500,
    heartEventIds: ['hu_xian_heart_1', 'hu_xian_heart_2', 'hu_xian_heart_3'],
    courtshipDialogues: [
      '狐仙接过狐火灯笼，眼中闪过一丝惊讶后笑了：「你这是……在向一只狐狸求缘？」',
      '「{player}，今晚做了个有你的梦。什么内容？秘密。」',
      '「以前觉得人类短暂得可怜。现在觉得……正因短暂，才格外珍贵。」'
    ],
    courtshipCraftCost: [
      { itemId: 'ruby', quantity: 8 },
      { itemId: 'gold_bar', quantity: 8 },
      { itemId: 'moonstone', quantity: 5 }
    ],
    bondCraftCost: [
      { itemId: 'ruby', quantity: 12 },
      { itemId: 'gold_bar', quantity: 12 },
      { itemId: 'moonstone', quantity: 8 },
      { itemId: 'prismatic_shard', quantity: 3 }
    ],
    bondBonuses: [{ type: 'sell_bonus', percent: 15 }],
    abilities: [
      {
        id: 'hu_xian_1',
        affinityRequired: 700,
        name: '狐眼',
        description: '商店价格降低5%',
        passive: { type: 'sell_bonus', value: 5 }
      },
      {
        id: 'hu_xian_2',
        affinityRequired: 1400,
        name: '灵探',
        description: '矿洞额外掉落概率提升',
        passive: { type: 'luck', value: 15 }
      },
      {
        id: 'hu_xian_3',
        affinityRequired: 2100,
        name: '幻商',
        description: '旅行商人多1件稀有商品',
        passive: { type: 'luck', value: 10 }
      }
    ],
    manifestationDay: { season: 'autumn', day: 7 }
  },

  // ============================================================
  // 5. 山翁 — 采药仙翁
  // ============================================================
  {
    id: 'shan_weng',
    name: '山翁',
    trueName: '清虚',
    gender: 'male',
    title: '采药仙翁',
    origin: '追随桃源乡建村隐士到此修炼的老仙人，常年隐于深山采药，以葫芦盛丹，以松涛为伴。',
    personality: '超然淡泊、不苟言笑',
    discoverySteps: [
      {
        id: 'shan_weng_rumor',
        phase: 'rumor',
        conditions: [
          { type: 'mineFloor', minFloor: 50 },
          { type: 'skill', skillType: 'mining', minLevel: 8 }
        ],
        scenes: [
          {
            text: '矿洞深处，你发现了一本泛黄的古册，封面写着「清虚修炼手札」。'
          },
          {
            text: '翻开第一页：「入山五百年，丹成九转。桃源之下，地脉灵气最盛处，吾将闭关于此。」'
          }
        ],
        logMessage: '【仙缘】矿洞深处发现一本古老的修炼手札……'
      },
      {
        id: 'shan_weng_glimpse',
        phase: 'glimpse',
        conditions: [
          { type: 'season', season: 'winter' },
          { type: 'weather', weather: 'sunny' },
          { type: 'location', panel: 'mining' }
        ],
        scenes: [
          { text: '冬日的矿洞深处，你听到一阵悠远的箫声，苍凉而古朴。' },
          {
            text: '循着箫声走去，你隐约看到一位白发老者盘坐在矿脉旁，周身环绕着淡金色的灵气。'
          },
          {
            text: '你踏前一步，脚下的碎石发出声响。老者睁开眼，你只觉一股浩然之气扑面而来，一晃神间他已消失不见。'
          }
        ],
        logMessage: '【仙缘】矿洞深处，一位白发老者正在修炼，转瞬即逝。'
      },
      {
        id: 'shan_weng_encounter',
        phase: 'encounter',
        conditions: [
          { type: 'item', itemId: 'ginseng', quantity: 1 },
          { type: 'item', itemId: 'snow_lotus', quantity: 1 }
        ],
        scenes: [
          {
            text: '你带着人参和雪莲进入矿洞，灵气明显比平时浓郁。那位老者坐在洞壁前，面前摆着一个古铜色的丹炉。'
          },
          { text: '「来了。」他声音低沉而平静，仿佛早已预料到你的来访。' },
          {
            text: '「年轻人，你为何深入矿洞？」他睁开一只眼，浑浊的瞳孔中闪过精光。',
            choices: [
              {
                text: '为了变得更强。',
                friendshipChange: 60,
                response: '「尚可。有志气，但不可执念太深。」他点了点头。'
              },
              {
                text: '为了探索未知。',
                friendshipChange: 80,
                response: '「好。求知之心，是修行的根基。」他罕见地露出赞许的目光。'
              },
              {
                text: '为了赚钱。',
                friendshipChange: 20,
                response: '「……」他沉默良久，摇了摇头，「凡夫俗子。不过坦诚倒也难得。」'
              }
            ]
          },
          {
            text: '「去吧。待你真正准备好了，再来此处。」他闭上眼，周身灵气再次涌动。'
          }
        ],
        logMessage: '【仙缘】矿洞深处邂逅了一位修炼的老仙人。'
      },
      {
        id: 'shan_weng_revealed',
        phase: 'revealed',
        conditions: [
          { type: 'questComplete', questId: 'main_3_5' },
          { type: 'skill', skillType: 'mining', minLevel: 8 }
        ],
        scenes: [
          { text: '你再次来到矿洞深处，老仙人正在煮茶。一壶清茶，两只杯子。' },
          { text: '「坐。」他指了指对面的石头。这是他第一次邀请你。' },
          {
            text: '「吾号清虚，在此修行已逾五百年。既有缘，偶尔来坐坐也无妨。」他端起茶杯，嘴角微微上扬。'
          }
        ],
        logMessage: '【仙缘】仙翁清虚邀你共饮清茶，缘分由此开始。'
      }
    ],
    resonantOfferings: ['ginseng', 'snow_lotus', 'antler_velvet'],
    pleasedOfferings: ['herb', 'iron_ore', 'gold_ore', 'copper_ore', 'tea'],
    repelledOfferings: ['trash', 'wood', 'driftwood'],
    dialogues: {
      wary: ['「修行之人，不喜打扰。」', '「你身上的杀气太重，静一静再来。」'],
      curious: ['「嗯，今日矿洞的灵气有些不同。」', '「你的体质……比普通凡人要好些。」'],
      trusting: ['「{player}，来，陪老夫下一盘棋。」', '「修行最忌急躁。你今日比昨日沉稳了。」'],
      devoted: ['「五百年来，第一次觉得有人值得传授衣钵。」', '「{player}，你已不仅是凡人了。」'],
      eternal: ['「吾之道，即你之道。」', '「清虚一生不收弟子，但你……是例外中的例外。」']
    },
    interactionType: 'cultivation',
    bondable: true,
    courtshipItemId: 'cultivation_jade',
    bondItemId: 'immortal_gourd',
    courtshipThreshold: 1800,
    bondThreshold: 2500,
    heartEventIds: ['shan_weng_heart_1', 'shan_weng_heart_2', 'shan_weng_heart_3'],
    courtshipDialogues: [
      '仙翁接过修炼玉佩，沉默了很久：「……这份心意，老夫收下了。」',
      '「{player}，今日的功课你做得不错。来，喝杯热茶。」',
      '「你知道吗，五百年前老夫也曾年轻过。那时候……算了，不说了。」'
    ],
    courtshipCraftCost: [
      { itemId: 'jade', quantity: 8 },
      { itemId: 'gold_bar', quantity: 8 },
      { itemId: 'ginseng', quantity: 5 }
    ],
    bondCraftCost: [
      { itemId: 'ginseng', quantity: 10 },
      { itemId: 'antler_velvet', quantity: 8 },
      { itemId: 'iridium_bar', quantity: 5 },
      { itemId: 'moonstone', quantity: 8 }
    ],
    bondBonuses: [{ type: 'spirit_shield', staminaSave: 20, hpBonus: 30 }],
    abilities: [
      {
        id: 'shan_weng_1',
        affinityRequired: 600,
        name: '聚气',
        description: '挖矿体力消耗-15%',
        passive: { type: 'stamina_save', value: 15 }
      },
      {
        id: 'shan_weng_2',
        affinityRequired: 1200,
        name: '灵脉',
        description: '矿洞中概率采到稀有草药',
        passive: { type: 'luck', value: 12 }
      },
      {
        id: 'shan_weng_3',
        affinityRequired: 2000,
        name: '金丹',
        description: '最大体力永久+20',
        passive: { type: 'max_stamina', value: 20 }
      }
    ],
    manifestationDay: { season: 'winter', day: 1 }
  },

  // ============================================================
  // 6. 归女 — 织梦归女
  // ============================================================
  {
    id: 'gui_nv',
    name: '归女',
    trueName: '锦归',
    gender: 'female',
    title: '织梦归女',
    origin: '一位思乡织女的执念所化。她生前织出的布匹天下无双，死后灵魂不散，以丝线与月光继续编织，只为织出一条回家的路。',
    personality: '温婉忧郁、内敛深情',
    discoverySteps: [
      {
        id: 'gui_nv_rumor',
        phase: 'rumor',
        conditions: [{ type: 'npcFriendship', npcId: 'su_su', minFriendship: 2000 }],
        scenes: [
          {
            text: '素素今天显得有些心神不宁：「{player}，你有没有……在夜里听到过织机的声音？」'
          },
          {
            text: '「我家旁边的旧屋子，每到月光好的夜晚就会传来吱呀吱呀的声音……好像有人在织布。」'
          },
          {
            text: '「我去看过，里面什么都没有。但那声音……是真的。」素素的眼神中透着不安。'
          }
        ],
        logMessage: '【仙缘】素素说夜里能听到织机声，旧屋中却空无一人……'
      },
      {
        id: 'gui_nv_glimpse',
        phase: 'glimpse',
        conditions: [
          { type: 'timeRange', minHour: 22, maxHour: 24 },
          { type: 'item', itemId: 'silk', quantity: 1 },
          { type: 'location', panel: 'village' }
        ],
        scenes: [
          {
            text: '深夜的村庄万籁俱寂。你路过旧屋时，果然听到了那个声音——吱呀，吱呀。'
          },
          {
            text: '透过窗棂，月光中一台古老的织机正自行运转，银白色的丝线在空中飞舞。'
          },
          {
            text: '你看到一个模糊的女子身影坐在织机前，她的泪水化作银丝融入布匹中。'
          },
          {
            text: '你手中的蚕丝微微发光，与织机上的丝线遥相呼应。那身影回过头来，但随即消散如烟。'
          }
        ],
        logMessage: '【仙缘】深夜旧屋中，一位织女的幽影在月光下织布……'
      },
      {
        id: 'gui_nv_encounter',
        phase: 'encounter',
        conditions: [
          { type: 'season', season: 'winter' },
          { type: 'item', itemId: 'silk', quantity: 3 },
          { type: 'item', itemId: 'moonstone', quantity: 1 }
        ],
        scenes: [
          {
            text: '冬夜，你带着蚕丝和月光石走进旧屋。织机前空空如也，但你将蚕丝和月光石放在织机上。'
          },
          {
            text: '银白色的光芒从月光石中涌出，丝线自行缠绕在织轴上。织机开始运转，一个身影从光芒中凝聚成形。'
          },
          {
            text: '一位面容清秀的女子坐在织机前，泪痕犹在。她看着你，轻声说：「你……能看见我？」',
            choices: [
              {
                text: '我能看见你。你在哭吗？',
                friendshipChange: 80,
                response: '她怔了一下，擦去眼角的泪：「很久没有人……对我说话了。」'
              },
              {
                text: '你是谁？为什么在这里织布？',
                friendshipChange: 60,
                response: '「我在织一条回家的路。」她轻声说，「可是……我已经忘了家在哪里了。」'
              },
              {
                text: '素素很担心你。',
                friendshipChange: 40,
                response: '「那个裁缝姑娘吗？」她微微笑了笑，「她的手艺很好，和我当年一样。」'
              }
            ]
          },
          {
            text: '天亮前她的身影再次变淡：「如果你愿意……明天再来陪我织一会儿吧。」'
          }
        ],
        logMessage: '【仙缘】旧屋织机前，织梦归女终于愿意开口说话了。'
      },
      {
        id: 'gui_nv_revealed',
        phase: 'revealed',
        conditions: [
          { type: 'npcFriendship', npcId: 'su_su', minFriendship: 3500 },
          { type: 'questComplete', questId: 'main_2_4' }
        ],
        scenes: [
          {
            text: '你连续多日来到旧屋陪伴织女。今夜，她的身影比以往更加清晰。'
          },
          {
            text: '「你的陪伴让我想起了很多事。」她放下梭子，第一次离开织机走到你面前。'
          },
          {
            text: '「我叫锦归。归字是归乡的归。」她轻轻笑了，「或许……这里就是我的归处。」'
          }
        ],
        logMessage: '【仙缘】织梦归女锦归不再执着于回家的路，选择留在桃源。'
      }
    ],
    resonantOfferings: ['silk', 'wool', 'moonstone'],
    pleasedOfferings: ['alpaca_wool', 'rabbit_foot', 'cloth'],
    repelledOfferings: ['quartz', 'charcoal', 'copper_ore'],
    dialogues: {
      wary: ['「……」她低着头织布，不愿多说。', '「你……不怕我吗？」'],
      curious: ['「今天的月光很好。」她的织速放慢了些。', '「你来了……坐吧。」'],
      trusting: ['「{player}，看，这是我新织的花样。你觉得好看吗？」', '「和你说话的时候，我几乎忘了自己不是活人。」'],
      devoted: ['「{player}……如果可以，我想为你织一件永不磨损的衣裳。」', '「你让我觉得，即使是执念，也可以变成美好的东西。」'],
      eternal: ['「锦归的丝线，只为你一人而织。」', '「不需要回家的路了。你在哪里，哪里就是家。」']
    },
    interactionType: 'dreamwalk',
    bondable: true,
    courtshipItemId: 'silver_thread_ring',
    bondItemId: 'starlight_loom',
    courtshipThreshold: 1800,
    bondThreshold: 2500,
    heartEventIds: ['gui_nv_heart_1', 'gui_nv_heart_2', 'gui_nv_heart_3'],
    courtshipDialogues: [
      '归女接过银丝戒指，手指微微颤抖：「这是……给我的？活人也愿意和我……」她没有说完，眼眶泛红。',
      '「{player}，我今天在你的梦里织了一片星空。看到了吗？」',
      '「有时候我在想，是不是因为遇见了你，我才没有消散。」'
    ],
    courtshipCraftCost: [
      { itemId: 'silk', quantity: 25 },
      { itemId: 'moonstone', quantity: 8 },
      { itemId: 'gold_bar', quantity: 5 }
    ],
    bondCraftCost: [
      { itemId: 'silk', quantity: 50 },
      { itemId: 'moonstone', quantity: 12 },
      { itemId: 'prismatic_shard', quantity: 5 },
      { itemId: 'gold_bar', quantity: 8 }
    ],
    bondBonuses: [{ type: 'animal_blessing', chance: 0.25 }],
    abilities: [
      {
        id: 'gui_nv_1',
        affinityRequired: 500,
        name: '织速',
        description: '布料加工时间-30%',
        passive: { type: 'exp_boost', value: 30 }
      },
      {
        id: 'gui_nv_2',
        affinityRequired: 1100,
        name: '梦丝',
        description: '织机概率产出梦丝',
        passive: { type: 'luck', value: 8 }
      },
      {
        id: 'gui_nv_3',
        affinityRequired: 1900,
        name: '灵抚',
        description: '动物好感获取+25%',
        passive: { type: 'exp_boost', value: 25 }
      }
    ],
    manifestationDay: { season: 'winter', day: 21 }
  }
]

/** 根据ID获取隐藏NPC定义 */
export const getHiddenNpcById = (id: string): HiddenNpcDef | undefined => HIDDEN_NPCS.find(n => n.id === id)
