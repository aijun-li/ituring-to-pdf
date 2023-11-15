# ITURING TO PDF

鉴于图灵社区不再提供 PDF 版本书籍，EPUB 等版本对技术书籍的展示不友好，利用脚本生成在线阅读的 PDF 版本。

## 声明

仅用于图灵社区正版电子书已购者生成 PDF 使用，请勿传播生成的 PDF 书籍。

## 使用方法

通过 `config.js` 进行配置

1. 登录图灵社区后获取 token

```javascript
export const token = 'xxxx';
```

2. 配置需要生成的书籍 id

```javascript
export const bookId = 'xxxx';
```

3. (可选) 配置目录层级生成规则，返回大于等于 1 的数字

```javascript
/**
 * @param chapter 章节信息
 *
 * @returns number(>=1)，对应章节所属层级
 */
export function calcLevel(chapter) {
  return 1;
}
```

4. 执行脚本

```bash
node src/index.js
```
