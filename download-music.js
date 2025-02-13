const { exec } = require("child_process");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

async function downloadAndConvert(url) {
  if (!url) {
    console.log("Por favor, forneça um URL do YouTube.");
    return;
  }

  console.log("Baixando áudio...");
  
  // Nome do arquivo com título dinâmico baseado no vídeo
  const outputFile = path.join(__dirname, "%(title)s.%(ext)s");

  exec(`yt-dlp -f bestaudio -o "${outputFile}" ${url}`, (error, stdout, stderr) => {
    if (error) {
      console.error("Erro ao baixar o áudio:", error);
      console.error(stderr);
      return;
    }
    console.log("Download concluído. Convertendo para MP3...");

    // A saída pode ser uma lista de arquivos, então vamos lidar com isso
    const files = fs.readdirSync(__dirname).filter(file => file.endsWith(".webm") || file.endsWith(".m4a"));
    
    files.forEach(file => {
      const outputMp3 = path.join(__dirname, `${path.basename(file, path.extname(file))}.mp3`);
      
      ffmpeg(path.join(__dirname, file))
        .audioCodec("libmp3lame")
        .toFormat("mp3")
        .on("end", () => {
          console.log(`Conversão concluída! Arquivo salvo como: ${outputMp3}`);
          fs.unlinkSync(path.join(__dirname, file));  // Deleta o arquivo original
        })
        .on("error", (err) => console.error("Erro na conversão:", err))
        .save(outputMp3);
    });
  });
}

const youtubeURL = process.argv[2];
downloadAndConvert(youtubeURL);
