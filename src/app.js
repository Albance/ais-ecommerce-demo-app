const { algoliasearch, instantsearch } = window;
const { autocomplete } = window['@algolia/autocomplete-js'];
const { createLocalStorageRecentSearchesPlugin } =
  window['@algolia/autocomplete-plugin-recent-searches'];
const { createQuerySuggestionsPlugin } =
  window['@algolia/autocomplete-plugin-query-suggestions'];

const searchClient = algoliasearch(
  'R8B6JVP0WR',
  'a3dc53b3528e1eb23f54841c2248e615'
);

const search = instantsearch({
  indexName: 'products_demo',
  searchClient,
  future: { preserveSharedStateOnUnmount: true },
  insights: true,
});

const virtualSearchBox = instantsearch.connectors.connectSearchBox(() => {});

search.addWidgets([
  virtualSearchBox({}),
  instantsearch.widgets.hits({
    container: '#hits',
    templates: {
      item: (hit, { html, components }) => html`
        <article>
          <img src=${hit.image} alt=${hit.name} />
          <div>
            <h1>${components.Highlight({ hit, attribute: 'name' })}</h1>
            <p>${components.Highlight({ hit, attribute: 'description' })}</p>
            <p><strong>Brand:</strong> ${hit.brand}</p>
            <p><strong>Price:</strong> £${hit.price}</p>
            <p><strong>Rating:</strong> ${'★'.repeat(hit.rating || 0)}</p>
          </div>
        </article>
      `,
    },
  }),
  instantsearch.widgets.configure({
    hitsPerPage: 8,
  }),
  // Replaced combined refinementList with two separate filters
  instantsearch.widgets.panel({
    templates: { header: () => 'Brand' },
  })(instantsearch.widgets.refinementList)({
    container: '#brand-list',
    attribute: 'brand',
  }),
  instantsearch.widgets.panel({
    templates: { header: () => 'Type' },
  })(instantsearch.widgets.refinementList)({
    container: '#type-list',
    attribute: 'type',
  }),
  instantsearch.widgets.pagination({
    container: '#pagination',
  }),
]);

search.start();

const recentSearchesPlugin = createLocalStorageRecentSearchesPlugin({
  key: 'instantsearch',
  limit: 3,
  transformSource({ source }) {
    return {
      ...source,
      onSelect({ setIsOpen, setQuery, item, event }) {
        onSelect({ setQuery, setIsOpen, event, query: item.label });
      },
    };
  },
});

const querySuggestionsPlugin = createQuerySuggestionsPlugin({
  searchClient,
  indexName: 'instant_search_demo_query_suggestions',
  getSearchParams() {
    return recentSearchesPlugin.data.getAlgoliaSearchParams({ hitsPerPage: 6 });
  },
  transformSource({ source }) {
    return {
      ...source,
      sourceId: 'querySuggestionsPlugin',
      onSelect({ setIsOpen, setQuery, event, item }) {
        onSelect({ setQuery, setIsOpen, event, query: item.query });
      },
      getItems(params) {
        if (!params.state.query) {
          return [];
        }

        return source.getItems(params);
      },
    };
  },
});

autocomplete({
  container: '#searchbox',
  openOnFocus: true,
  detachedMediaQuery: 'none',
  onSubmit({ state }) {
    setInstantSearchUiState({ query: state.query });
  },
  plugins: [recentSearchesPlugin, querySuggestionsPlugin],
});

function setInstantSearchUiState(indexUiState) {
  search.mainIndex.setIndexUiState({ page: 1, ...indexUiState });
}

function onSelect({ setIsOpen, setQuery, event, query }) {
  if (isModifierEvent(event)) {
    return;
  }

  setQuery(query);
  setIsOpen(false);
  setInstantSearchUiState({ query });
}

function isModifierEvent(event) {
  const isMiddleClick = event.button === 1;

  return (
    isMiddleClick ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  );
}
