const blocks = [...document.querySelectorAll('pre > code.language-mermaid')];

if (blocks.length > 0) {
  import('https://cdn.jsdelivr.net/npm/mermaid@11.16.1/dist/mermaid.esm.min.mjs')
    .then(({ default: mermaid }) => {
      mermaid.registerIconPacks([
        {
          name: 'logos',
          loader: async () => {
            const response = await fetch(
              'https://cdn.jsdelivr.net/npm/@iconify-json/logos@1.2.12/icons.json'
            );
            if (!response.ok) {
              throw new Error(`AWS icon request failed with status ${response.status}`);
            }
            return response.json();
          }
        }
      ]);

      const appearances = {
        light: {
          darkMode: false,
          background: '#ffffff',
          primaryColor: '#e8f0fe',
          primaryTextColor: '#111111',
          primaryBorderColor: '#174ea6',
          secondaryColor: '#f5f5f5',
          secondaryTextColor: '#111111',
          tertiaryColor: '#ffffff',
          tertiaryTextColor: '#111111',
          lineColor: '#333333',
          textColor: '#111111',
          clusterBkg: '#f5f5f5',
          clusterBorder: '#666666',
          edgeLabelBackground: '#ffffff'
        },
        dark: {
          darkMode: true,
          background: '#171717',
          primaryColor: '#263957',
          primaryTextColor: '#ffffff',
          primaryBorderColor: '#aecbfa',
          secondaryColor: '#202124',
          secondaryTextColor: '#ffffff',
          tertiaryColor: '#171717',
          tertiaryTextColor: '#ffffff',
          lineColor: '#eeeeee',
          textColor: '#ffffff',
          clusterBkg: '#202124',
          clusterBorder: '#aaaaaa',
          edgeLabelBackground: '#171717'
        },
        contrast: {
          darkMode: true,
          background: '#000000',
          primaryColor: '#000000',
          primaryTextColor: '#ffffff',
          primaryBorderColor: '#ffff00',
          secondaryColor: '#000000',
          secondaryTextColor: '#ffffff',
          tertiaryColor: '#000000',
          tertiaryTextColor: '#ffffff',
          lineColor: '#ffffff',
          textColor: '#ffffff',
          clusterBkg: '#000000',
          clusterBorder: '#ffffff',
          edgeLabelBackground: '#000000'
        }
      };

      function currentAppearance() {
        const selected = document.documentElement.dataset.theme;
        if (selected === 'contrast') return 'contrast';
        if (selected === 'dark') return 'dark';
        if (selected === 'light') return 'light';
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }

      let renderNumber = 0;
      async function renderAll() {
        const appearance = currentAppearance();
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'base',
          flowchart: { htmlLabels: false },
          themeVariables: appearances[appearance]
        });

        for (const [index, code] of blocks.entries()) {
          const source = code.textContent?.trim();
          const fallback = code.parentElement;
          if (!source || !(fallback instanceof HTMLPreElement)) continue;

          let diagram = fallback.nextElementSibling;
          if (!(diagram instanceof HTMLElement) || !diagram.classList.contains('mermaid-diagram')) {
            diagram = document.createElement('div');
            diagram.className = 'mermaid-diagram';
            diagram.setAttribute('role', 'img');
            fallback.insertAdjacentElement('afterend', diagram);
          }

          const description = source.match(/^\s*accDescr:\s*(.+)$/m)?.[1]?.trim();
          diagram.setAttribute(
            'aria-label',
            description || 'Architecture diagram. The Mermaid source is available when rendering fails.'
          );

          try {
            const id = `mermaid-diagram-${index}-${renderNumber++}`;
            const { svg, bindFunctions } = await mermaid.render(id, source);
            diagram.innerHTML = svg;
            bindFunctions?.(diagram);
            diagram.hidden = false;
            fallback.hidden = true;
          } catch (error) {
            diagram.hidden = true;
            fallback.hidden = false;
            console.error('Mermaid could not render a diagram; its source is shown instead.', error);
          }
        }
      }

      renderAll();
      document.addEventListener('colour-theme-change', renderAll);
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
        const selected = document.documentElement.dataset.theme;
        if (!selected || selected === 'system') renderAll();
      });
    })
    .catch((error) => {
      console.error('Mermaid could not load. Diagram source remains visible.', error);
    });
}
