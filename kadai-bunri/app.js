/*
 * 課題の分離トレーニング
 *
 * ビルド不要の素の JavaScript です。HTML の中に画面（section）を全部置いておき、
 * 「いま見せる画面」以外を隠すことで、1ページの中で画面を切り替えています。
 *
 * 記録は localStorage（ブラウザの中の小さな保存場所）に入れています。
 * サーバーに送らないので、つらい出来事を書いても他の人に見られません。
 * そのかわり、別の端末やブラウザとは共有されません。
 */
(function () {
  "use strict";

  // ---------------------------------------------------------------
  // データ
  // ---------------------------------------------------------------

  var CHARMS = [
    "あの人の機嫌は、あの人のもの。",
    "不機嫌な人がいても、原因があなたとは限らない。",
    "余裕がないのは、荷物を持ちすぎているサイン。",
    "完璧な親じゃなくていい。やり直せる親でいい。",
    "相手を変えることはできない。でも、自分の受け止め方は選べる。",
    "嫌われないように生きなくても、あなたには価値がある。",
    "先回りして機嫌をとらなくても、大丈夫。",
    "「手伝おうか？」は言っていい。でも、頼まれてない荷物は持たなくていい。",
    "子どもの人生は子どものもの。あなたの人生はあなたのもの。",
    "気づけた回数が、練習の成果。",
  ];

  // 場面ごとの仕分け候補。owner は「目安」で、正解の押しつけではない。
  // self = 自分 / other = 相手 / joint = 共同
  var SCENES = {
    child: {
      label: "子ども",
      who: "子ども",
      items: [
        { text: "子どもが宿題や片付けをするかどうか", owner: "other" },
        { text: "子どもが泣いたり不機嫌になったりすること", owner: "other" },
        { text: "私がイライラしていること", owner: "self" },
        { text: "私がどんな言葉で伝えるか", owner: "self" },
        { text: "私が休めているか・余裕があるか", owner: "self" },
        { text: "子どもの安全（けが・危ないこと）", owner: "joint" },
        { text: "周りから「ダメな親」と思われるか", owner: "other" },
      ],
    },
    partner: {
      label: "パートナー・家族",
      who: "相手",
      items: [
        { text: "相手が不機嫌でいること", owner: "other" },
        { text: "相手の不機嫌を直すこと", owner: "other" },
        { text: "相手の態度を私がどう受け止めるか", owner: "self" },
        { text: "私が自分の気持ちや希望を伝えるかどうか", owner: "self" },
        { text: "相手が私をどう思うか", owner: "other" },
        { text: "家事や育児の分担", owner: "joint" },
      ],
    },
    work: {
      label: "職場",
      who: "相手",
      items: [
        { text: "上司や同僚が不機嫌なこと", owner: "other" },
        { text: "私が自分の担当の仕事をすること", owner: "self" },
        { text: "相手が私の仕事をどう評価するか", owner: "other" },
        { text: "その場から少し離れる・距離をとること", owner: "self" },
        { text: "チームの仕事の進め方", owner: "joint" },
      ],
    },
    parent: {
      label: "自分の親",
      who: "親",
      items: [
        { text: "親が私の子育てに口を出すこと", owner: "other" },
        { text: "親の意見を取り入れるかどうか", owner: "self" },
        { text: "親の機嫌や寂しさ", owner: "other" },
        { text: "どのくらいの頻度で会う・連絡するか", owner: "self" },
        { text: "親に認めてもらえるかどうか", owner: "other" },
      ],
    },
    other: {
      label: "その他",
      who: "相手",
      items: [
        { text: "相手の機嫌や感情", owner: "other" },
        { text: "相手が私をどう思うか", owner: "other" },
        { text: "私がどう受け止めて、どう行動するか", owner: "self" },
      ],
    },
  };

  var THOUGHTS = [
    "私が何かしたのかも",
    "私が機嫌を直さなきゃ",
    "嫌われたらどうしよう",
    "怒られる前に先回りしなきゃ",
    "私が我慢すればいい",
    "私はダメな親だ",
    "ちゃんとさせなきゃ",
    "私がなんとかしなきゃ",
  ];

  var ACTIONS = [
    "深呼吸を3回する",
    "その場を5分離れる",
    "自分の飲み物をいれる",
    "「私のせいとは限らない」と心の中で言う",
    "気持ちを一言だけ伝える",
    "キツく言ったことを謝る",
    "今日は早めに寝る",
  ];

  var OWNERS = {
    self: { label: "わたしの荷物", short: "自分" },
    other: { label: "相手の荷物", short: "相手" },
    joint: { label: "共同の荷物", short: "共同" },
  };

  // 練習問題。explain で「なぜそうなるか」を必ず伝える。
  var QUIZ = [
    {
      scene: "夫が仕事から帰ってきて、ため息をついて無言で部屋に入った。",
      q: "夫が不機嫌でいること",
      owner: "other",
      explain: "不機嫌でいること、その気分をどう扱うかは夫自身が引き受けることです。原因があなたかどうかも、まだ分かりません。",
    },
    {
      scene: "夫が仕事から帰ってきて、ため息をついて無言で部屋に入った。",
      q: "その様子を見て、私がどう過ごすか",
      owner: "self",
      explain: "相手の気分は変えられませんが、自分がどう受け止め、どう過ごすかは選べます。いつも通り夕飯を食べてもいいのです。",
    },
    {
      scene: "子どもが「宿題やりたくない」と言ってダラダラしている。",
      q: "子どもが宿題をするかどうか",
      owner: "other",
      explain: "宿題をしなかった結果（先生に言われる、困る）を引き受けるのは子どもです。親ができるのは「手伝えることある？」と声をかけること。年齢が小さいうちは、一緒にやると合意して共同の課題にすることもできます。",
    },
    {
      scene: "子どもが「宿題やりたくない」と言ってダラダラしている。",
      q: "そんな子どもにイライラする私の気持ち",
      owner: "self",
      explain: "イライラするのは自然なことです。その気持ちをどう扱うか（休む、深呼吸する、誰かに話す）は自分の課題です。",
    },
    {
      scene: "子どもが道路に飛び出しそうになった。",
      q: "子どもの安全を守ること",
      owner: "joint",
      explain: "命や安全に関わることは、子どもが自分で引き受けきれません。親が守る責任があります。課題の分離は「放っておく」ことではありません。",
    },
    {
      scene: "上司が朝からピリピリしていて、口調がキツい。",
      q: "上司の機嫌をよくすること",
      owner: "other",
      explain: "上司の機嫌は上司のもの。あなたが先回りして機嫌をとる必要はありません。あなたの課題は、自分の担当業務をすることです。",
    },
    {
      scene: "上司が朝からピリピリしていて、口調がキツい。",
      q: "上司が私をどう評価するか",
      owner: "other",
      explain: "評価は相手が決めることです。あなたにできるのは、自分の仕事を自分なりにやることまで。そこから先はコントロールできません。",
    },
    {
      scene: "実家の母から「そんな育て方じゃダメよ」と言われた。",
      q: "母のアドバイスを取り入れるかどうか",
      owner: "self",
      explain: "母が意見を言うのは母の課題。それを取り入れるかどうかを決めるのはあなたです。全部受け入れなくても、親不孝ではありません。",
    },
    {
      scene: "実家の母から「そんな育て方じゃダメよ」と言われた。",
      q: "母に「いい母親だ」と認めてもらうこと",
      owner: "other",
      explain: "どう評価するかは母の課題です。認めてもらうために頑張り続けるより、自分が大切にしたい子育てを選んでいいのです。",
    },
    {
      scene: "子どもにキツく怒ってしまい、子どもが泣いている。",
      q: "怒りすぎたことを子どもに謝るかどうか",
      owner: "self",
      explain: "自分の行動の後始末は自分の課題です。「さっきは言いすぎた、ごめんね」と謝れることは、子どもにとっても大切な学びになります。",
    },
    {
      scene: "子どもにキツく怒ってしまい、子どもが泣いている。",
      q: "子どもが悲しい気持ちをどう落ち着けるか",
      owner: "other",
      explain: "気持ちを感じて落ち着けていくのは子ども自身です。親はそばにいる、抱きしめるなど支えることはできますが、悲しみを無理に消す必要はありません。",
    },
    {
      scene: "夫婦で、休日の家事を誰がやるかで揉めた。",
      q: "家事の分担",
      owner: "joint",
      explain: "家のことは二人に関わるので、話し合って決める共同の課題にできます。ただし、どちらかが勝手に背負うのではなく「話し合って合意する」ことが大切です。",
    },
  ];

  // ---------------------------------------------------------------
  // 保存（localStorage）
  // ---------------------------------------------------------------
  // プライベートモードなどでは localStorage が使えないことがあるので、
  // 失敗してもアプリが止まらないよう try/catch で包んでいます。

  var STORE_KEY = "kadai-bunri.v1";

  function loadLog() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveLog(list) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      return false;
    }
  }

  // ---------------------------------------------------------------
  // 小さな道具
  // ---------------------------------------------------------------

  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  // ユーザーが書いた文字を画面に出すときは必ずこれを通す。
  // 「<」などをそのまま入れると、HTML として解釈されて表示が崩れるため。
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function formatDate(iso) {
    var d = new Date(iso);
    return (d.getMonth() + 1) + "/" + d.getDate() + " " +
      String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }

  // ---------------------------------------------------------------
  // 画面の切り替え
  // ---------------------------------------------------------------

  var current = "home";

  function go(name) {
    if (name !== "sos") stopBreath();
    $all(".screen").forEach(function (el) {
      el.classList.toggle("active", el.dataset.screen === name);
    });
    current = name;
    if (name === "home") renderHome();
    if (name === "work") startWork();
    if (name === "quiz") startQuiz();
    if (name === "log") renderLog();
    window.scrollTo(0, 0);
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-go]");
    if (t) go(t.dataset.go);
  });

  // ---------------------------------------------------------------
  // ホーム
  // ---------------------------------------------------------------

  var charmIndex = Math.floor(Math.random() * CHARMS.length);

  function renderHome() {
    $("#charm-text").textContent = CHARMS[charmIndex];
    var n = loadLog().length;
    $("#log-count").textContent = n ? n + "件の記録があります" : "まだ記録はありません";
  }

  $("#charm-next").addEventListener("click", function () {
    charmIndex = (charmIndex + 1) % CHARMS.length;
    $("#charm-text").textContent = CHARMS[charmIndex];
  });

  // ---------------------------------------------------------------
  // 整理ワーク
  // ---------------------------------------------------------------

  var LAST_STEP = 7;
  var STEP_NAMES = ["", "いまの気持ち", "起きたこと", "浮かんだ考え", "仕分け", "手放す", "ふりかえり", ""];
  var work; // 入力中の内容をまとめて持つ

  function startWork() {
    work = {
      step: 1,
      before: 5,
      after: 5,
      scene: null,
      fact: "",
      thoughts: [],
      thoughtFree: "",
      items: [], // { text, owner: null|"self"|"other"|"joint", hint }
      action: "",
    };
    $("#before").value = 5;
    $("#before-out").textContent = "5";
    $("#after").value = 5;
    $("#after-out").textContent = "5";
    $("#fact").value = "";
    $("#thought-free").value = "";
    $("#action").value = "";
    $("#high-alert").hidden = true;
    renderSceneChips();
    renderThoughtChips();
    renderActionChips();
    showStep();
  }

  function showStep() {
    $all(".step").forEach(function (el) {
      el.classList.toggle("active", Number(el.dataset.step) === work.step);
    });
    var done = work.step === LAST_STEP;
    $("#work-nav").hidden = done;
    $("#prev").style.visibility = work.step === 1 ? "hidden" : "visible";
    $("#next").textContent = work.step === LAST_STEP - 1 ? "記録する" : "つぎへ";
    $("#step-label").textContent = done ? "" : "ステップ " + work.step + " / " + (LAST_STEP - 1) + "　" + STEP_NAMES[work.step];
    $("#progress-bar").style.width = Math.round((work.step - 1) / (LAST_STEP - 1) * 100) + "%";

    if (work.step === 4) renderSort();
    if (work.step === 5) renderRelease();
    window.scrollTo(0, 0);
  }

  // つぎへ進む前の確認。足りないところがあれば理由を伝えて止める。
  function validate() {
    if (work.step === 2 && !work.scene) {
      alert("誰との間のことか、ひとつ選んでください。");
      return false;
    }
    if (work.step === 4) {
      var left = work.items.filter(function (it) { return !it.owner; }).length;
      if (left) {
        return confirm("まだ仕分けていない項目が" + left + "つあります。このまま進みますか？\n（分からないものは、分からないままで大丈夫です）");
      }
    }
    return true;
  }

  $("#next").addEventListener("click", function () {
    if (!validate()) return;
    if (work.step === LAST_STEP - 1) finishWork();
    work.step = Math.min(LAST_STEP, work.step + 1);
    showStep();
  });

  $("#prev").addEventListener("click", function () {
    work.step = Math.max(1, work.step - 1);
    showStep();
  });

  // --- ステップ1・6：不安度 ---
  $("#before").addEventListener("input", function (e) {
    work.before = Number(e.target.value);
    $("#before-out").textContent = e.target.value;
    $("#high-alert").hidden = work.before < 8;
  });
  $("#after").addEventListener("input", function (e) {
    work.after = Number(e.target.value);
    $("#after-out").textContent = e.target.value;
  });

  // --- ステップ2：場面 ---
  function renderSceneChips() {
    var box = $("#scene-chips");
    box.innerHTML = "";
    Object.keys(SCENES).forEach(function (key) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = SCENES[key].label;
      b.addEventListener("click", function () {
        if (work.scene !== key) {
          work.scene = key;
          // 場面を変えたら、仕分け候補もその場面のものに入れ替える
          work.items = SCENES[key].items.map(function (it) {
            return { text: it.text, owner: null, hint: it.owner };
          });
        }
        $all("#scene-chips .chip").forEach(function (c) { c.classList.remove("on"); });
        b.classList.add("on");
      });
      box.appendChild(b);
    });
  }
  $("#fact").addEventListener("input", function (e) { work.fact = e.target.value; });

  // --- ステップ3：浮かんだ考え ---
  function renderThoughtChips() {
    var box = $("#thought-chips");
    box.innerHTML = "";
    THOUGHTS.forEach(function (t) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = t;
      b.addEventListener("click", function () {
        var i = work.thoughts.indexOf(t);
        if (i >= 0) work.thoughts.splice(i, 1); else work.thoughts.push(t);
        b.classList.toggle("on", i < 0);
      });
      box.appendChild(b);
    });
  }
  $("#thought-free").addEventListener("input", function (e) { work.thoughtFree = e.target.value; });

  // --- ステップ4：仕分け ---
  function renderSort() {
    var box = $("#sort-list");
    box.innerHTML = "";
    work.items.forEach(function (it, idx) {
      var row = document.createElement("div");
      row.className = "sort-item" + (it.owner ? " sorted-" + it.owner : "");

      var head = document.createElement("div");
      head.className = "sort-head";
      head.innerHTML = '<span class="sort-text">' + esc(it.text) + "</span>";
      var del = document.createElement("button");
      del.type = "button";
      del.className = "icon-btn";
      del.setAttribute("aria-label", "この項目を消す");
      del.textContent = "×";
      del.addEventListener("click", function () {
        work.items.splice(idx, 1);
        renderSort();
      });
      head.appendChild(del);
      row.appendChild(head);

      var btns = document.createElement("div");
      btns.className = "owner-btns small";
      Object.keys(OWNERS).forEach(function (o) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "owner owner-" + o + (it.owner === o ? " on" : "");
        b.textContent = OWNERS[o].short;
        b.addEventListener("click", function () {
          it.owner = o;
          renderSort();
        });
        btns.appendChild(b);
      });
      row.appendChild(btns);

      // 目安と違う選び方をしたときだけ、やさしく別の見方を添える。
      // 「不正解」とは言わない。迷うこと自体が練習だから。
      if (it.owner && it.hint && it.owner !== it.hint) {
        var p = document.createElement("p");
        p.className = "sort-hint";
        p.textContent = "こんな見方もあります：多くの場合「" + OWNERS[it.hint].label + "」と考えられます。結果を最終的に引き受けるのは誰か、もう一度だけ考えてみても。";
        row.appendChild(p);
      }
      box.appendChild(row);
    });
  }

  $("#add-item").addEventListener("submit", function (e) {
    e.preventDefault(); // フォーム送信でページが再読み込みされるのを止める
    var input = $("#add-item-text");
    var text = input.value.trim();
    if (!text) return;
    work.items.push({ text: text, owner: null, hint: null });
    input.value = "";
    renderSort();
  });

  // --- ステップ5：手放す ---
  function renderRelease() {
    var who = work.scene ? SCENES[work.scene].who : "相手";
    var others = work.items.filter(function (it) { return it.owner === "other"; });
    var selfs = work.items.filter(function (it) { return it.owner === "self"; });
    var joints = work.items.filter(function (it) { return it.owner === "joint"; });

    var html = "";
    if (others.length) {
      html += '<div class="release other"><p class="release-title">' + esc(who) + "に返す荷物</p><ul>";
      others.forEach(function (it) {
        html += "<li>「" + esc(it.text) + "」は、" + esc(who) + "の課題。<br><strong>私が背負わなくていい。</strong></li>";
      });
      html += "</ul></div>";
    }
    if (selfs.length) {
      html += '<div class="release self"><p class="release-title">わたしが持つ荷物</p><ul>';
      selfs.forEach(function (it) { html += "<li>" + esc(it.text) + "</li>"; });
      html += "</ul></div>";
    }
    if (joints.length) {
      html += '<div class="release joint"><p class="release-title">話し合って一緒に持つ荷物</p><ul>';
      joints.forEach(function (it) { html += "<li>" + esc(it.text) + "</li>"; });
      html += "</ul></div>";
    }
    if (!html) html = '<p class="hint">仕分けた項目がありません。もどって仕分けても、このまま進んでも大丈夫です。</p>';
    $("#release-list").innerHTML = html;
    $("#joint-tip").hidden = joints.length === 0;
  }

  function renderActionChips() {
    var box = $("#action-chips");
    box.innerHTML = "";
    ACTIONS.forEach(function (a) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = a;
      b.addEventListener("click", function () {
        $("#action").value = a;
        work.action = a;
      });
      box.appendChild(b);
    });
  }
  $("#action").addEventListener("input", function (e) { work.action = e.target.value; });

  // --- 記録して終える ---
  function finishWork() {
    var entry = {
      date: new Date().toISOString(),
      scene: work.scene,
      fact: work.fact.trim(),
      thoughts: work.thoughts.slice(),
      thoughtFree: work.thoughtFree.trim(),
      items: work.items.filter(function (it) { return it.owner; })
        .map(function (it) { return { text: it.text, owner: it.owner }; }),
      action: work.action.trim(),
      before: work.before,
      after: work.after,
    };
    var list = loadLog();
    list.unshift(entry); // 新しいものを先頭に
    var saved = saveLog(list);

    var diff = work.before - work.after;
    var msg;
    if (diff > 0) msg = "しんどさが " + work.before + " → " + work.after + " になりました。荷物を少し下ろせたのかもしれません。";
    else if (diff === 0) msg = "数字は変わらなくても大丈夫。立ち止まって整理しようとしたこと自体が、大切な一歩です。";
    else msg = "思い出して、かえってしんどくなったのかもしれません。今日はここまでにして、自分をいたわってください。";
    if (!saved) msg += "（この端末では記録を保存できませんでした）";
    $("#done-msg").textContent = msg;

    var s = "";
    if (entry.action) s += '<p><span class="tag">やってみること</span>' + esc(entry.action) + "</p>";
    s += "<p>あなたは今日、人の荷物と自分の荷物を分けてみました。それができたあなたは、ちゃんと前に進んでいます。</p>";
    $("#summary").innerHTML = s;
  }

  // ---------------------------------------------------------------
  // 練習問題
  // ---------------------------------------------------------------

  var quiz;

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function startQuiz() {
    quiz = { order: shuffle(QUIZ.slice()).slice(0, 6), i: 0, matched: 0 };
    showQuestion();
  }

  function showQuestion() {
    var item = quiz.order[quiz.i];
    $("#quiz-label").textContent = "練習 " + (quiz.i + 1) + " / " + quiz.order.length;
    $("#quiz-scene").textContent = item.scene;
    $("#quiz-q").textContent = "「" + item.q + "」は、誰の荷物？";
    $("#quiz-feedback").hidden = true;
    $("#quiz-next").hidden = true;

    var box = $("#quiz-btns");
    box.innerHTML = "";
    Object.keys(OWNERS).forEach(function (o) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "owner owner-" + o;
      b.textContent = OWNERS[o].label;
      b.addEventListener("click", function () { answer(o); });
      box.appendChild(b);
    });
  }

  function answer(o) {
    var item = quiz.order[quiz.i];
    var ok = o === item.owner;
    if (ok) quiz.matched++;
    $all("#quiz-btns button").forEach(function (b) {
      b.disabled = true;
      if (b.classList.contains("owner-" + item.owner)) b.classList.add("on");
    });
    var fb = $("#quiz-feedback");
    fb.innerHTML = "<p class=\"fb-head\">" + (ok ? "そうですね。" : "こんな見方もあります。") +
      "「" + esc(OWNERS[item.owner].label) + "」</p><p>" + esc(item.explain) + "</p>";
    fb.hidden = false;
    var last = quiz.i === quiz.order.length - 1;
    $("#quiz-next").textContent = last ? "おわる" : "つぎの問題";
    $("#quiz-next").hidden = false;
  }

  $("#quiz-next").addEventListener("click", function () {
    if (quiz.i === quiz.order.length - 1) {
      alert(quiz.order.length + "問中 " + quiz.matched + "問、同じ見方ができました。\n迷った問題こそ、あなたが背負いやすい荷物のヒントです。");
      go("home");
      return;
    }
    quiz.i++;
    showQuestion();
  });

  // ---------------------------------------------------------------
  // 記録
  // ---------------------------------------------------------------

  function renderLog() {
    var list = loadLog();
    var box = $("#log-list");
    $("#clear-log").hidden = list.length === 0;
    if (!list.length) {
      box.innerHTML = '<p class="hint">まだ記録はありません。モヤモヤしたときに「整理する」を使うと、ここにたまっていきます。</p>';
      return;
    }
    box.innerHTML = list.map(function (en, idx) {
      var scene = en.scene && SCENES[en.scene] ? SCENES[en.scene].label : "";
      var others = en.items.filter(function (it) { return it.owner === "other"; });
      var h = '<details class="log-item"><summary>' +
        '<span class="log-date">' + esc(formatDate(en.date)) + "</span>" +
        '<span class="log-scene">' + esc(scene) + "</span>" +
        '<span class="log-meter">' + en.before + " → " + en.after + "</span></summary>";
      if (en.fact) h += '<p><span class="tag">起きたこと</span>' + esc(en.fact) + "</p>";
      var th = en.thoughts.concat(en.thoughtFree ? [en.thoughtFree] : []);
      if (th.length) h += '<p><span class="tag">浮かんだ考え</span>' + th.map(esc).join("、") + "</p>";
      if (others.length) h += '<p><span class="tag">返した荷物</span>' + others.map(function (it) { return esc(it.text); }).join("、") + "</p>";
      if (en.action) h += '<p><span class="tag">やってみること</span>' + esc(en.action) + "</p>";
      h += '<button class="link-btn" type="button" data-del="' + idx + '">この記録を消す</button></details>';
      return h;
    }).join("");
  }

  $("#log-list").addEventListener("click", function (e) {
    var t = e.target.closest("[data-del]");
    if (!t) return;
    if (!confirm("この記録を消しますか？")) return;
    var list = loadLog();
    list.splice(Number(t.dataset.del), 1);
    saveLog(list);
    renderLog();
  });

  $("#clear-log").addEventListener("click", function () {
    if (!confirm("すべての記録を消します。元には戻せません。よろしいですか？")) return;
    saveLog([]);
    renderLog();
  });

  // ---------------------------------------------------------------
  // 呼吸ガイド（4秒吸う・2秒止める・6秒吐く）
  // ---------------------------------------------------------------

  var BREATH = [
    { text: "吸って", sec: 4, cls: "in" },
    { text: "止めて", sec: 2, cls: "hold" },
    { text: "吐いて", sec: 6, cls: "out" },
  ];
  var breathTimer = null;

  function runBreath(i) {
    var phase = BREATH[i];
    var circle = $("#breath-circle");
    circle.className = "breath-circle " + phase.cls;
    circle.style.transitionDuration = phase.sec + "s";
    $("#breath-text").textContent = phase.text;
    breathTimer = setTimeout(function () { runBreath((i + 1) % BREATH.length); }, phase.sec * 1000);
  }

  function stopBreath() {
    if (breathTimer) clearTimeout(breathTimer);
    breathTimer = null;
    var circle = $("#breath-circle");
    if (!circle) return;
    circle.className = "breath-circle";
    $("#breath-text").textContent = "はじめる";
    $("#breath-toggle").textContent = "呼吸をはじめる";
  }

  $("#breath-toggle").addEventListener("click", function () {
    if (breathTimer) { stopBreath(); return; }
    $("#breath-toggle").textContent = "とめる";
    runBreath(0);
  });

  // ---------------------------------------------------------------
  go("home");
})();
