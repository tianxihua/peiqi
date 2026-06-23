# GitHub Pages 部署说明

这个项目已经整理好了可部署目录：

- 游戏入口：`docs/index.html`
- 脚本：`docs/src/main.js`
- 样式：`docs/style.css`
- 资源：`docs/assets/skins/`

## 你下一步要做什么

1. 在 GitHub 新建一个仓库。
2. 把 `/Users/liuyueqin/Desktop/皓宇游戏` 整个文件夹内容上传到这个仓库。
3. 确保仓库里能看到 `docs` 文件夹。
4. 打开 GitHub 仓库页面。
5. 点 `Settings`。
6. 点左侧 `Pages`。
7. 在 `Build and deployment` 里把 `Source` 设成 `Deploy from a branch`。
8. Branch 选择默认分支，一般是 `main`。
9. Folder 选择 `/docs`。
10. 点 `Save`。

## 部署后地址

几分钟后，GitHub 会生成一个地址，通常像这样：

`https://你的GitHub用户名.github.io/你的仓库名/`

## 你现在最该上传的目录

如果你只想先把这个游戏传上去，至少要保证这些文件在仓库里：

- `docs/index.html`
- `docs/style.css`
- `docs/src/main.js`
- `docs/assets/skins/pistol-sheet.png`
- `docs/assets/skins/rifle-sheet.png`

## 注意

- 这个游戏现在是纯前端静态页面，适合 GitHub Pages。
- 账号、段位、聊天这些数据目前保存在浏览器本地 `localStorage`。
- 不同设备、不同浏览器之间不会自动同步数据。
