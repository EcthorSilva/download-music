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

  const outputFile = path.join(__dirname, "%(title)s.%(ext)s");

  exec(`yt-dlp -f bestaudio --yes-playlist -o "${outputFile}" ${url}`, (error, stdout, stderr) => {
    if (error) {
      console.error("Erro ao baixar o áudio:", error);
      console.error(stderr);
      return;
    }

    console.log("Download concluído. Verificando arquivos baixados...");

    // Verificando os arquivos baixados
    const files = fs.readdirSync(__dirname).filter(file => file.endsWith(".webm") || file.endsWith(".m4a"));

    console.log("Arquivos baixados:", files);

    if (files.length === 0) {
      console.log("Nenhum arquivo de áudio foi baixado.");
      return;
    }

    console.log("Iniciando conversão para MP3...");
    
    files.forEach(file => {
      const outputMp3 = path.join(__dirname, `${path.basename(file, path.extname(file))}.mp3`);

      console.log(`Convertendo ${file} para MP3...`);
      
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
