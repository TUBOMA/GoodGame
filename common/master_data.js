// master_data.js
const GameMasterData = {
  achievements: [
      { id: 'achieve_l_play_1', name: '最初の出撃', desc: 'ラストウォーを1回プレイ', flavor: '誰もが最初は新兵だ。生き残る術を学べ。', game: 'l', category: 'play', tier: 1 },
      { id: 'achieve_l_play_10', name: '歴戦の勇士', desc: 'ラストウォーを10回プレイ', flavor: '戦場の匂いが染み付いてきたようだ。', game: 'l', category: 'play', tier: 2 },
      { id: 'achieve_l_play_100', name: '戦場の亡霊', desc: 'ラストウォーを100回プレイ', flavor: '終わらない戦い。それでも君は銃を取る。', game: 'l', category: 'play', tier: 3 },
      { id: 'achieve_l_clear_1', name: '初勝利の美酒', desc: 'ラストウォーを1回クリア', flavor: '勝利の味は格別だろう？', game: 'l', category: 'clear', tier: 1 },
      { id: 'achieve_l_clear_10', name: '英雄の凱旋', desc: 'ラストウォーを10回クリア', flavor: '君の背中についていく者が増えてきた。', game: 'l', category: 'clear', tier: 2 },
      { id: 'achieve_l_clear_100', name: '生ける伝説', desc: 'ラストウォーを100回クリア', flavor: '敵は君の名を聞いただけで逃げ出すだろう。', game: 'l', category: 'clear', tier: 3 },
      { id: 'achieve_l_clear_streak_3', name: '無敗の軍団', desc: 'ラストウォーを3連続でクリア', flavor: '3連勝。この勢いは誰にも止められない。', game: 'l', category: 'skill', tier: 1 },
      { id: 'achieve_l_initial_10', name: '頼れる仲間たち', desc: 'ラストウォーで最初の人数が10人に到達', flavor: '10人の絆で、最初からクライマックスだ。', game: 'l', category: 'skill', tier: 2 },

      { id: 'achieve_c_play_1', name: 'クリックの幕開け', desc: 'クリッカーを1回プレイ', flavor: '指先の運動が、世界を動かす第一歩。', game: 'c', category: 'play', tier: 1 },
      { id: 'achieve_c_play_10', name: 'マウスクラッシャー予備軍', desc: 'クリッカーを10回プレイ', flavor: '指の筋肉が悲鳴を上げ始めている。', game: 'c', category: 'play', tier: 2 },
      { id: 'achieve_c_play_100', name: '狂気のクリッカー', desc: 'クリッカーを100回プレイ', flavor: 'マウスは消耗品だということを知った。', game: 'c', category: 'play', tier: 3 },
      { id: 'achieve_c_manual_10', name: 'アマチュアストライカー', desc: 'クリッカーで手動攻撃力10', flavor: '自分の手で殴るのも悪くない。', game: 'c', category: 'atk_m', tier: 1 },
      { id: 'achieve_c_manual_100', name: 'プロストライカー', desc: 'クリッカーで手動攻撃力100', flavor: 'その指先には破壊神が宿っている。', game: 'c', category: 'atk_m', tier: 2 },
      { id: 'achieve_c_manual_1000', name: 'ゴッドフィンガー', desc: 'クリッカーで手動攻撃力1000', flavor: 'マウスのクリック音が雷鳴のように轟く。', game: 'c', category: 'atk_m', tier: 3 },
      { id: 'achieve_c_auto_10', name: '小さな自動化工場', desc: 'クリッカーで自動攻撃力10', flavor: 'ほったらかしで稼ぐ快感を知ってしまった。', game: 'c', category: 'atk_a', tier: 1 },
      { id: 'achieve_c_auto_100', name: '巨大産業の支配者', desc: 'クリッカーで自動攻撃力100', flavor: '寝ていても富が転がり込んでくる。', game: 'c', category: 'atk_a', tier: 2 },
      { id: 'achieve_c_auto_1000', name: '宇宙規模の自動化', desc: 'クリッカーで自動攻撃力1000', flavor: '単位がインフレしすぎてよくわからなくなってきた。', game: 'c', category: 'atk_a', tier: 3 },
      { id: 'achieve_c_click_10000', name: '一万回のクリック', desc: 'クリッカーで1万回クリック', flavor: '指の第一関節に勲章を与えよう。', game: 'c', category: 'skill', tier: 1 },
      { id: 'achieve_c_kill_100', name: '百人斬り', desc: 'クリッカーで100体敵を倒す', flavor: '倒した敵の数は、もはや覚えていない。', game: 'c', category: 'skill', tier: 2 },

      { id: 'achieve_s_play_1', name: '記憶への挑戦', desc: '神経衰弱を1回プレイ', flavor: '脳細胞が活性化する音が聞こえる。', game: 's', category: 'play', tier: 1 },
      { id: 'achieve_s_play_10', name: '記憶の宮殿の住人', desc: '神経衰弱を10回プレイ', flavor: 'カードの裏側が透けて見える…気がする。', game: 's', category: 'play', tier: 2 },
      { id: 'achieve_s_play_100', name: '全知全能（自称）', desc: '神経衰弱を100回プレイ', flavor: 'すべての配置はすでに私の頭の中にある。', game: 's', category: 'play', tier: 3 },
      { id: 'achieve_s_clear_1', name: '名探偵の誕生', desc: '神経衰弱を1回クリア', flavor: '直感と記憶の勝利だ。', game: 's', category: 'clear', tier: 1 },
      { id: 'achieve_s_clear_10', name: '瞬間記憶能力者', desc: '神経衰弱を10回クリア', flavor: '目に映るすべてを記憶できると錯覚する。', game: 's', category: 'clear', tier: 2 },
      { id: 'achieve_s_clear_100', name: 'アカシックレコード', desc: '神経衰弱を100回クリア', flavor: '宇宙のすべての記憶にアクセスできそうだ。', game: 's', category: 'clear', tier: 3 },
      { id: 'achieve_s_perfect', name: '完全記憶', desc: '神経衰弱をミスなしでクリア', flavor: 'ミス？何の話だ？最初からすべてわかっていた。', game: 's', category: 'skill', tier: 1 },
      { id: 'achieve_s_zero_pair', name: '記憶喪失', desc: '神経衰弱で一つもペアを見つけずに負ける', flavor: '嘘だろ…一枚も揃えられなかっただと…？', game: 's', category: 'skill', tier: 2 },

      { id: 'achieve_i_play_1', name: '電撃の洗礼', desc: 'イライラ棒を1回プレイ', flavor: '手の震えは恐怖か、それとも興奮か。', game: 'i', category: 'play', tier: 1 },
      { id: 'achieve_i_play_10', name: '鋼の精神', desc: 'イライラ棒を10回プレイ', flavor: '焦燥感と上手く付き合えるようになってきた。', game: 'i', category: 'play', tier: 2 },
      { id: 'achieve_i_play_100', name: 'イライラマスター', desc: 'イライラ棒を100回プレイ', flavor: '悟りを開いたかのように冷静なマウス捌き。', game: 'i', category: 'play', tier: 3 },
      { id: 'achieve_i_clear_1', name: '無傷の帰還', desc: 'イライラ棒を1回クリア', flavor: 'ギリギリの緊張感を乗り越えた。', game: 'i', category: 'clear', tier: 1 },
      { id: 'achieve_i_clear_10', name: '神回避', desc: 'イライラ棒を10回クリア', flavor: '針の穴を通すような精密なコントロール。', game: 'i', category: 'clear', tier: 2 },
      { id: 'achieve_i_clear_100', name: '電流の支配者', desc: 'イライラ棒を100回クリア', flavor: 'もはやイライラ棒と一体化している。', game: 'i', category: 'clear', tier: 3 },
      { id: 'achieve_i_speedrun', name: '音速のネズミ', desc: 'イライラ棒をほぼ最速でクリア', flavor: '瞬きする間にゴールに到達した。', game: 'i', category: 'skill', tier: 1 },
      { id: 'achieve_i_death_10', name: '感電マニア', desc: 'イライラ棒で1プレイで10回以上死ぬ', flavor: '痛みを求めているのか？学習能力がないのか？', game: 'i', category: 'skill', tier: 2 },
      
      { id: 'achieve_all_play_1', name: 'はじめての冒険', desc: 'いずれかのゲームを合計1回プレイする', flavor: 'すべての偉大な記録も、この一歩から始まる。', game: 'common', category: 'play_total', tier: 1 },
      { id: 'achieve_all_play_10', name: '駆け出しゲーマー', desc: 'いずれかのゲームを合計10回プレイする', flavor: '少しずつこの場所にも慣れてきた頃合いだろう。', game: 'common', category: 'play_total', tier: 2 },
      { id: 'achieve_all_play_100', name: 'ベテランの風格', desc: 'いずれかのゲームを合計100回プレイする', flavor: '君の遊びへの情熱は本物だ。', game: 'common', category: 'play_total', tier: 3 },
      { id: 'achieve_all_play_1000', name: 'アーケードマスター', desc: 'いずれかのゲームを合計1000回プレイする', flavor: '千の戦いを越えた者。もはや誰も君を止められない。', game: 'common', category: 'play_total', tier: 4 },

      { id: 'achieve_shop_buy_1', name: 'はじめてのおつかい', desc: 'アイテムを初めて買う', flavor: '資本主義の罠へようこそ。', game: 'common', category: 'shop', tier: 1 },
      { id: 'achieve_shop_buy_10', name: 'お得意様', desc: 'アイテムを10回買う', flavor: 'まいどあり！次は何を買ってくれるんだい？', game: 'common', category: 'shop', tier: 2 },
      { id: 'achieve_shop_buy_100', name: '散財の極み', desc: 'アイテムを100回買う', flavor: '買い物依存症の疑いがあります。', game: 'common', category: 'shop', tier: 3 },
      { id: 'achieve_shop_buy_all', name: 'コンプリートバイヤー', desc: '全てを最低一度は買う', flavor: 'ショップの在庫は空っぽだ！', game: 'common', category: 'shop', tier: 4 }
    ],
  
    shop: [
          { id: 'l_plus', name: 'ラストウォー強化', desc: 'ラストウォーで最初の人が一人増えます。（無制限）', basePrice: 300, max: 5, game: 'l', category: 'buff', tier: -1,
            calcPrice: (base, n) => base + Math.pow(n, 2) * 100 },
            
          { id: 'i_bougai_ikkokesu', name: '妨害キャンセラー', desc: 'イライラ棒の妨害ギミックが1つ消えます。（最大6個まで）', basePrice: 300, max: 6, game: 'i', category: 'buff', tier: 1,
            calcPrice: (base, n) => base + Math.pow(n, 2) * 100 },
            
          { id: 's_miss_plus', name: '神経衰弱 ミス上限+1', desc: '神経衰弱でミスしていい回数が1回増えます。（無制限）', basePrice: 300, max: -1, game: 's', category: 'buff', tier: 1,
            calcPrice: (base, n) => base + (150 * n) },
            
          { id: 'c', name: 'クリッカー トークン', desc: 'クリッカーゲームで強化に使えるトークン。（無制限）', basePrice: 500, max: -1, game: 'c', category: 'buff', tier: 1,
            calcPrice: (base, n) => base }
        ]
};
