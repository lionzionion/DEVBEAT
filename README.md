<div align="center">

# 🎧 DEVBEAT

### Seu código tem ritmo. Sua playlist também.

**Um player de música feito para quem cria, estuda e vive tecnologia.**

[🌐 Acessar versão web](https://lionzionion.github.io/DEVBEAT/) · [💻 GitHub do desenvolvedor](https://github.com/lionzionion)

![JavaScript](https://img.shields.io/badge/JavaScript-ES_Modules-F7DF1E?logo=javascript&logoColor=000)
![HTML5](https://img.shields.io/badge/HTML5-Web-E34F26?logo=html5&logoColor=fff)
![CSS3](https://img.shields.io/badge/CSS3-Responsive-1572B6?logo=css&logoColor=fff)
![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub_Pages-222?logo=github&logoColor=fff)

</div>

---

## 🚀 Sobre o projeto

**DEVBEAT** é um aplicativo web de música pensado para desenvolvedores. Combina descoberta de faixas, reprodução de áudio e modos **CodeFlow** em uma interface responsiva, projetada para acompanhar sessões de programação e estudo.

O projeto é uma edição web independente do protótipo original de aplicativo nativo. Esta versão usa o catálogo público do **Audius** e roda diretamente no navegador, sem exigir cadastro.

## ✨ Funcionalidades

- 🔎 **Explorar músicas:** busca de faixas e seção de tendências no catálogo público Audius.
- ▶️ **Player:** reproduzir, pausar, avançar, voltar, ajustar volume e acompanhar progresso.
- 🔀 **Modos de reprodução:** embaralhamento e repetição.
- 💻 **CodeFlow:** cinco modos musicais para diferentes momentos de programação.
- ❤️ **Sua biblioteca:** favoritos e playlists salvos localmente no navegador.
- 📱 **Design responsivo:** interface adaptada para desktop e dispositivos móveis.
- 🆓 **Acesso simples:** sem conta obrigatória e sem infraestrutura de servidor própria.

## 🛠️ Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Interface | HTML5, CSS3, JavaScript (ES Modules) |
| Reprodução | HTML Audio API |
| Catálogo musical | API pública Audius |
| Persistência local | `localStorage` |
| Publicação | GitHub Pages |
| Testes | Node.js |

## 🌐 Demonstração

**Versão própria do projeto:** [Abrir DEVBEAT Web](https://lionzionion.github.io/DEVBEAT/) (disponível após habilitar GitHub Pages em Settings → Pages → Source: GitHub Actions).

**Versão de referência no portfólio:** [DEVBEAT Web](https://lionzionion.github.io/portofolio/devbeat/).

## ⚙️ Executar localmente

Como a edição web é composta por arquivos estáticos, você pode servir o projeto com um servidor HTTP local:

```bash
npx serve .
```

Abra no navegador o endereço indicado pelo servidor. Para executar os testes e validações do projeto:

```bash
npm test
npm run check
```

## 📁 Organização do projeto

```text
DEVBEAT/
├── index.html
├── styles.css
├── app.js
├── catalog.mjs
├── manifest.webmanifest
├── package.json
├── tests/
├── .github/workflows/pages.yml
├── .nojekyll
├── LICENSE
└── README.md
```

## ⚠️ Limitações atuais

- A disponibilidade de músicas, streams e permissões CORS depende do serviço **Audius**; nem todas as faixas necessariamente serão reproduzidas.
- Favoritos, playlists e nome de exibição ficam armazenados no navegador: **não há sincronização entre dispositivos**.
- Esta edição **não** incorpora o catálogo ou as funcionalidades nativas do Spotube nem um backend de autenticação.

## 🧭 Próximos passos

Ideias para evolução do projeto: recomendações mais inteligentes, integração com Discord, experiências sociais e sincronização de biblioteca entre dispositivos. **Esses recursos ainda não fazem parte da versão atual.**

## 👨‍💻 Desenvolvimento

Projeto independente de [Leandro Dias](https://github.com/lionzionion), desenvolvido como parte de seu portfólio de aplicações e experimentação com produtos digitais.

**Catálogo e streams:** [Audius](https://audius.co/).