# Ink 脚本语言中文指南

Ink 是一种专为互动叙事设计的脚本语言，用于创建分支对话和选择驱动的故事。

---

## 第一部分：基础语法 (Basic Syntax)

### 1. 内容输出 (Content Output)

最简单的 ink 脚本就是纯文本：

```ink
你好，世界！
这是第二行。
```

### 2. 注释 (Comments)

```ink
// 单行注释 (single-line comment)

/*
   多行注释 (multi-line comment)
*/

TODO: 待办事项（编译时会显示提醒）
```

### 3. 标签 (Tags)

为内容添加元数据，不会显示给玩家：

```ink
这是一行对话。 # speaker:李明 # emotion:happy
```

---

## 第二部分：选项与分支 (Choices and Branching)

### 1. 基本选项 (Basic Choices)

使用 `*` 创建选项：

```ink
今天吃什么？
*   [吃火锅]
    火锅真香！
*   [吃烧烤]
    烧烤也不错！
```

### 2. 选项文本控制 (Choice Text Control)

方括号控制文本显示：
- 括号前 (before brackets)：选项和结果都显示
- 括号内 (inside brackets)：只在选项显示
- 括号后 (after brackets)：只在结果显示

```ink
"你好吗？"
*   "我很好[。"]，"我微笑着说。
```

输出选项：`"我很好。"`
选择后输出：`"我很好，"我微笑着说。`

### 3. 一次性选项 vs 重复选项 (Once-only vs Sticky Choices)

```ink
// * 表示一次性选项（选过后消失）(once-only choice)
*   [只能选一次的选项] -> somewhere

// + 表示重复选项（可以多次选择）(sticky choice)
+   [可以反复选择] -> somewhere
```

### 4. 条件选项 (Conditional Choices)

根据条件显示/隐藏选项：

```ink
*   { visited_paris } [返回巴黎] -> paris
*   { not visited_paris } [前往巴黎] -> paris
*   { money > 100 } [购买商品] -> buy
```

### 5. 备用选项 (Fallback Choice)

当没有其他选项时自动触发：

```ink
*   [选项A] -> a
*   [选项B] -> b
*   ->
    没有选项可选了，故事结束。
    -> END
```

---

## 第三部分：故事结构 (Story Structure)

### 1. 结 (Knot)

故事的主要段落，用 `===` 标记：

```ink
=== 开场 ===
故事从这里开始...
-> 第一章

=== 第一章 ===
这是第一章的内容。
-> END
```

### 2. 针 (Stitch)

Knot 内的子段落，用 `=` 标记：

```ink
=== 火车上 ===
= 一等舱
    豪华的座位...
= 二等舱
    普通的座位...
```

### 3. 跳转 (Divert)

使用 `->` 跳转到其他位置：

```ink
-> 目标knot
-> 目标knot.目标stitch
-> END  // 结束故事 (end story)
```

### 4. 粘连 (Glue)

使用 `<>` 阻止换行：

```ink
我们快步 <>
-> 回家

=== 回家 ===
<> 走回家。
```

输出：`我们快步走回家。`

---

## 第四部分：编织结构 (Weave)

### 1. 汇聚点 (Gather)

使用 `-` 将分支汇聚：

```ink
"你喜欢什么颜色？"
*   "红色。"
*   "蓝色。"
*   "绿色。"
-   "有趣的选择，"他说。
```

### 2. 嵌套选项 (Nested Choices)

使用多个 `*` 或 `-` 表示层级：

```ink
-   "凶手是谁？"
    *   "是管家！"
        "证据呢？"
        * *     "我看到了血迹！"
        * *     "直觉告诉我。"
    *   "我不知道。"
-   调查继续...
```

### 3. 标签 (Label)

给选项或汇聚点命名以便引用：

```ink
*   (greet) [打招呼] "你好！"
*   (ignore) [忽略他] ...

-   (结束)
    { greet: 他对你微笑。 }
```

---

## 第五部分：变量与逻辑 (Variables and Logic)

### 1. 全局变量 (Global Variables)

```ink
VAR health = 100
VAR player_name = "玩家"
VAR has_key = false

故事开始，{player_name}的生命值是{health}。
```

### 2. 临时变量 (Temporary Variables)

```ink
=== 某个场景 ===
~ temp score = 0
~ score = score + 10
你的得分是 {score}。
```

### 3. 逻辑运算 (Logic Operations)

```ink
~ health = health - 10
~ gold = gold + 50

{ health <= 0: 你死了。 }
{ gold >= 100: 你很有钱！ }
```

### 4. 条件块 (Conditional Blocks)

```ink
{ x > 0:
    x 是正数
- else:
    x 不是正数
}

// 多条件 (multiple conditions)
{
    - x == 0: 零
    - x > 0: 正数
    - else: 负数
}
```

### 5. 数学运算 (Mathematical Operations)

```ink
~ result = (a + b) * c / d
~ remainder = x mod 5
~ power = POW(2, 8)
~ random_num = RANDOM(1, 6)
```

---

## 第六部分：可变文本 (Variable Text)

### 1. 序列 (Sequence)

按顺序显示，最后一项重复：

```ink
{第一次|第二次|之后每次}你来到这里。
```

### 2. 循环 (Cycle)

循环显示：

```ink
今天是{&周一|周二|周三|周四|周五}。
```

### 3. 一次性 (Once-only)

每项只显示一次，之后为空：

```ink
{!惊讶！|还好。|无聊了。|}
```

### 4. 随机 (Shuffle)

随机选择：

```ink
掷骰子：{~一|二|三|四|五|六}点。
```

### 5. 条件文本 (Conditional Text)

```ink
{ has_key: 你有钥匙。 | 你没有钥匙。 }
```

---

## 第七部分：函数 (Functions)

### 1. 定义函数 (Defining Functions)

```ink
=== function double(x) ===
~ return x * 2

=== function greet(name) ===
你好，{name}！
```

### 2. 调用函数 (Calling Functions)

```ink
~ result = double(5)
结果是 {result}。

{greet("小明")}
```

### 3. 引用传参 (Pass by Reference)

修改传入的变量：

```ink
=== function add_health(ref hp, amount) ===
~ hp = hp + amount

~ add_health(health, 20)
```

---

## 第八部分：高级流程控制 (Advanced Flow Control)

### 1. 隧道 (Tunnel)

可返回的子流程：

```ink
-> 做梦 ->
醒来后继续...

=== 做梦 ===
你做了一个梦...
->->  // 返回调用处 (return to caller)
```

### 2. 线程 (Thread)

并行合并多个内容块：

```ink
=== 场景 ===
<- 环境描述
<- 角色对话
-> DONE

=== 环境描述 ===
房间很暗。
-> DONE

=== 角色对话 ===
*   [和他说话] "你好。"
-> DONE
```

### 3. 参数化结 (Parameterized Knot)

```ink
*   [指控张三] -> accuse("张三")
*   [指控李四] -> accuse("李四")

=== accuse(who) ===
"我指控{who}！"你大声说道。
```

---

## 第九部分：状态列表系统 (LIST State System)

### 1. 定义列表 (Defining LIST)

```ink
LIST 门状态 = 关闭, 打开, 锁住
VAR 前门 = 关闭
```

### 2. 使用列表 (Using LIST)

```ink
~ 前门 = 打开

{ 前门 == 打开:
    门是开着的。
}
```

### 3. 复用列表 (Reusing LIST)

```ink
LIST 温度状态 = 冷, 温, 热
VAR 水壶 = 冷
VAR 锅 = 冷

*   { 水壶 == 冷 } [烧水]
    ~ 水壶 = 热
```

---

## 第十部分：游戏查询函数 (Game Query Functions)

### 1. 访问计数 (Visit Count)

```ink
// knot/stitch 名称作为数字使用时返回访问次数
{ visited_paris > 0: 你去过巴黎。 }
{ visited_paris == 3: 你去过巴黎三次。 }
```

### 2. 回合计数 (TURNS_SINCE)

```ink
// 距离上次访问某处经过的回合数
{ TURNS_SINCE(-> 睡觉) > 10: 你很累了... }
```

### 3. 选项计数 (CHOICE_COUNT)

```ink
// 当前可用选项数量
{ CHOICE_COUNT() == 0: 没有选项了。 }
```

### 4. 随机数 (RANDOM)

```ink
~ dice = RANDOM(1, 6)
你掷出了 {dice} 点。
```

### 5. 随机种子 (SEED_RANDOM)

```ink
// 固定随机种子（用于测试）
~ SEED_RANDOM(12345)
```

---

## 第十一部分：常量 (Constants)

```ink
CONST MAX_HEALTH = 100
CONST PLAYER_NAME = "勇者"

VAR health = MAX_HEALTH
```

---

## 第十二部分：文件包含 (File Include)

```ink
INCLUDE 角色对话.ink
INCLUDE 场景/森林.ink
```

---

## 第十三部分：运行时 API (Runtime API - JavaScript/TypeScript)

### 1. 初始化 (Initialization)

```javascript
import { Story } from 'inkjs';

const story = new Story(compiledJsonString);
```

### 2. 读取内容 (Reading Content)

```javascript
while (story.canContinue) {
    const text = story.Continue();
    console.log(text);
}
```

### 3. 处理选项 (Handling Choices)

```javascript
if (story.currentChoices.length > 0) {
    story.currentChoices.forEach((choice, i) => {
        console.log(`${i + 1}: ${choice.text}`);
    });

    // 玩家选择后 (after player selection)
    story.ChooseChoiceIndex(playerChoice);
}
```

### 4. 获取标签 (Getting Tags)

```javascript
const tags = story.currentTags;  // 当前行的标签 (current line tags)
const globalTags = story.globalTags;  // 全局标签 (global tags)
```

### 5. 变量操作 (Variable Operations)

```javascript
// 读取 (read)
const health = story.variablesState["health"];

// 设置 (set)
story.variablesState["health"] = 100;
```

### 6. 变量观察 (Variable Observer)

```javascript
story.ObserveVariable("health", (varName, newValue) => {
    updateHealthUI(newValue);
});
```

### 7. 跳转到指定位置 (Jump to Path)

```javascript
story.ChoosePathString("chapter2");
story.ChoosePathString("chapter2.scene1");
```

### 8. 保存/加载 (Save/Load)

```javascript
// 保存 (save)
const savedState = story.state.ToJson();

// 加载 (load)
story.state.LoadJson(savedState);
```

### 9. 外部函数 (External Functions)

在 ink 中声明：
```ink
EXTERNAL playSound(soundName)
~ playSound("click")
```

在代码中绑定：
```javascript
story.BindExternalFunction("playSound", (name) => {
    audioPlayer.play(name);
});
```

---

## 快速参考 (Quick Reference)

| 语法 (Syntax) | 说明 (Description) |
|---------------|---------------------|
| `*` | 一次性选项 (once-only choice) |
| `+` | 重复选项 (sticky choice) |
| `===` | 结定义 (knot definition) |
| `=` | 针定义 (stitch definition) |
| `->` | 跳转 (divert) |
| `->->` | 隧道返回 (tunnel return) |
| `<-` | 线程 (thread) |
| `-` | 汇聚点 (gather) |
| `<>` | 粘连 (glue) |
| `~` | 逻辑行 (logic line) |
| `#` | 标签 (tag) |
| `{ }` | 条件/变量输出 (conditional/variable) |
| `[ ]` | 选项文本控制 (choice text control) |
| `VAR` | 全局变量 (global variable) |
| `CONST` | 常量 (constant) |
| `LIST` | 状态列表 (state list) |
| `temp` | 临时变量 (temporary variable) |
| `ref` | 引用传参 (pass by reference) |
| `-> END` | 结束故事 (end story) |
| `-> DONE` | 结束当前线程 (end current thread) |

---

## 可变文本语法 (Variable Text Syntax)

| 语法 (Syntax) | 说明 (Description) |
|---------------|---------------------|
| `{a\|b\|c}` | 序列 (sequence) - 按顺序显示，停在最后一项 |
| `{&a\|b\|c}` | 循环 (cycle) - 循环显示 |
| `{!a\|b\|c}` | 一次性 (once-only) - 每项只显示一次 |
| `{~a\|b\|c}` | 随机 (shuffle) - 随机选择 |
| `{cond:a\|b}` | 条件文本 (conditional text) |
| `{var}` | 变量输出 (print variable) |
