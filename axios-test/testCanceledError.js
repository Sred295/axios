const axios = require('axios');

axios.interceptors.request.use((config) => {
  if (typeof config.timeout === 'number' && config.timeout > 0) {
    config.cancelToken = new axios.CancelToken((cancel) => {
      setTimeout(() => {
        // Clone the config and replace the cancelToken with a marker
        const { cancelToken, ...rest } = config;
        const configForError = { 
          ...rest, 
          cancelToken: '[CANCEL_TOKEN_PRESENT]' 
        };
        cancel('Request timed out', configForError);
      }, config.timeout);
    });
  }
  return config;
});

axios.get('http://10.255.255.1', { timeout: 1 }).catch((error) => {
  console.error(JSON.stringify(error));
});