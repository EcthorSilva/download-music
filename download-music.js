const { spawn } = require("child_process");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

async function downloadAndConvert(url) {
  console.log("Baixando áudio...");

  const outputFile = path.join(__dirname, "%(playlist_index)s - %(title)s.%(ext)s");

  // Iniciar o processo yt-dlp com spawn
  const ytDlp = spawn("yt-dlp", [
    "-f", "bestaudio",
    "--yes-playlist",
    "-o", outputFile,
    url
  ]);

  ytDlp.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });

  ytDlp.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  ytDlp.on("close", (code) => {
    if (code !== 0) {
      console.error(`yt-dlp terminou com código ${code}`);
      return;
    }

    console.log("Download concluído. Verificando arquivos baixados...");

    // Esperar um pouco para garantir que o download foi finalizado
    setTimeout(() => {
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
            try {
              fs.unlinkSync(path.join(__dirname, file));  // Deleta o arquivo original
            } catch (err) {
              console.error(`Erro ao deletar o arquivo ${file}:`, err);
            }
          })
          .on("error", (err) => console.error("Erro na conversão:", err))
          .save(outputMp3);
      });
    }, 1000); // Atraso de 1 segundo para garantir que o download foi finalizado
  });
}

async function processUrls(urls) {
  for (const url of urls) {
    await downloadAndConvert(url);
  }
}

const input = process.argv[2];

if (input.endsWith(".json")) {
  const filePath = path.join(__dirname, input);
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Erro ao ler o arquivo JSON:", err);
      return;
    }
    if (data.trim().length === 0) {
      console.error("O arquivo JSON está vazio.");
      return;
    }
    try {
      const urls = JSON.parse(data);
      if (Array.isArray(urls)) {
        processUrls(urls);
      } else {
        console.error("O arquivo JSON deve conter uma lista de URLs.");
      }
    } catch (err) {
      console.error("Erro ao analisar o arquivo JSON:", err);
    }
  });
} else {
  downloadAndConvert(input);
}