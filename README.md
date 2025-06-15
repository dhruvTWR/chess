# ♟️ Multiplayer Chess Game

A real-time multiplayer chess game built using Node.js, Express, and Socket.IO, with drag-and-drop UI and move validation powered by chess.js. Players are assigned White or Black roles automatically, and additional users can spectate live games in the browser.

---

## 💻 Tech Stack

- **Frontend:** HTML, Tailwind CSS, Vanilla JavaScript  
- **Backend:** Node.js, Express.js  
- **Real-time Engine:** Socket.IO  
- **Chess Logic:** [chess.js](https://github.com/jhlywa/chess.js)  
- **Templating:** EJS  

---

## 🚀 Features

- 🎮 Real-time multiplayer chess with Socket.IO  
- ♟ Automatic player role assignment: White / Black / Spectator  
- ✅ Move validation using chess.js  
- 🖱 Drag-and-drop UI for piece movement  
- 🎨 Clean, responsive layout using Tailwind CSS
-  You can give it a try here : [GAME LINK](https://chess-075v.onrender.com)

---

## 📂 Project Structure

```
chess-multiplayer/
├── public/
│   └── js/
│       └── chessgame.js
├── views/
│   └── index.ejs
├── app.js
├── package.json
└── README.md
```

---

## 🛠️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/chess-multiplayer.git
cd chess-multiplayer
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Server

```bash
node app.js
```

### 4. Open in Browser

Visit: [http://localhost:3000](http://localhost:3000)

---

## 🌐 Deployment

### ✅ Recommended: [Render](https://render.com)

1. Push your code to GitHub
2. Create a Web Service on Render
3. Set:
   - **Build Command:** `npm install`
   - **Start Command:** `node app.js`
4. Deploy and get your live multiplayer chess app!

> ❌ **Note:** Vercel is **not recommended** for this project as it does not support long-lived WebSocket connections (required by Socket.IO).

---

## 🙌 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss your ideas.

---


## 🙏 Acknowledgements

- [chess.js](https://github.com/jhlywa/chess.js) for chess rule logic  
- [Socket.IO](https://socket.io/) for real-time multiplayer functionality  
- [Tailwind CSS](https://tailwindcss.com/) for fast and responsive styling  
