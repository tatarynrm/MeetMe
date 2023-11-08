const { Telegraf, Scenes, session, Markup } = require("telegraf");

const pool = require("../db/pool");
const https = require("https");
const fs = require("fs");
const axios = require("axios");
const path = require("path");
const downloadAndSaveFile = require("../helpers/savePhotos");
const { bot } = require("../app");
const savePath = "../downloads/";
const { enter, leave } = Scenes.Stage;
const userData = {};
const folderName = "img"; // Назва папки
const fullPath = path.join(__dirname, folderName); // Створення повного шляху

let profiles = [
  { name: 'Profile 1', age: 25 },
  { name: 'Profile 2', age: 30 },
  { name: 'Profile 3', age: 28 },
  // Додайте інші анкети за потреби
];

let currentProfileIndex = 0;

const likesScene = new Scenes.WizardScene(
  'likesScene',
  (ctx) => {
    if (currentProfileIndex < profiles.length) {
      const currentProfile = profiles[currentProfileIndex];
      const message = `Name: ${currentProfile.name}\nAge: ${currentProfile.age}`;
   console.log(currentProfileIndex);
      ctx.reply(message, {reply_markup:{
        keyboard:[
          [{text:"Like"}]
        ]
      }});
    } else {
      ctx.reply('No more profiles available.');
      ctx.scene.leave();
    }
  }
);

likesScene.hears('like', (ctx) => {
  // Оновіть інформацію в базі даних для поточної анкети як лайк
  const currentProfile = profiles[currentProfileIndex];
  ctx.reply(`You liked ${currentProfile.name}'s profile.`);
  currentProfileIndex = currentProfileIndex + 1
  console.log(currentProfile);
  ctx.scene.reenter();
});

likesScene.action('dislike', (ctx) => {
  // Оновіть інформацію в базі даних для поточної анкети як дизлайк
  const currentProfile = profiles[currentProfileIndex];
  ctx.reply(`You disliked ${currentProfile.name}'s profile.`);
  currentProfileIndex++;
  ctx.scene.reenter();
});




module.exports = likesScene;
