# Fluidez da animação no mobile

## Causas encontradas

- `scene.js` usava a altura variável da janela para normalizar o scroll e recalcular a projeção da câmara. Alterações da barra do navegador podiam mudar o enquadramento durante o gesto.
- Cada evento `resize` chamava `setPixelRatio` e `setSize`. No Three.js 0.180.0, o primeiro já chama o segundo: o canvas era redimensionado duas vezes, mesmo sem alteração das dimensões.
- O compositor do CRT recalculava texto, brilho e retrato em cada frame, embora o conteúdo do canvas fosse atualizado apenas 24 vezes por segundo na abertura e duas vezes por segundo depois.
- A câmara seguia diretamente os eventos de scroll, sem interpolação entre posições recebidas.

## Correção

A cena usa uma altura estável (`100lvh`, com fallback `100vh`) e só redimensiona o buffer quando as dimensões ou a densidade efetivamente mudam. A câmara interpola o scroll em função do tempo. O brilho e a composição do conteúdo ficam em cache até o conteúdo mudar; ruído, linhas e persistência do fósforo continuam animados em cada frame. A resolução e os efeitos foram preservados.

A distinção entre viewport estável e dinâmico é descrita na [documentação do WebKit](https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/).

## Verificação local

Comparação isolada antes/depois no mesmo navegador, uma cena de cada vez, após a abertura. Scroll controlado durante 10 segundos, de 0 a 1,65 alturas de viewport e de volta. Viewport interno: 388 × 842, DPR 2; limite de renderização mobile mantido em 1,5.

| Medida | Antes | Depois |
| --- | ---: | ---: |
| Chamadas gráficas por frame, média | 23 | 8,5 |
| Chamadas gráficas por frame, mínimo | 23 | 8 |
| Chamadas gráficas por frame, máximo | 23 | 23 |
| Reposições do canvas em 20 eventos resize sem alteração das dimensões | 40 | 0 |

A redução média de chamadas gráficas foi de 63%. Ambos os testes tiveram 600 frames no computador; isto não mede o FPS nem a GPU de um iPhone real. O pico de 23 chamadas permanece necessário quando o texto/retrato muda.

Build e sintaxe passaram. Foram verificados scroll de ida/volta, entrada/saída da cena, orientação vertical/horizontal e atualização do terminal, sem erros no console. O harness e os resultados brutos ficam em `.artifacts/scroll-perf/` (arquivos locais ignorados pelo Git).
