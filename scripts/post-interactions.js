'use strict';

// Override the theme asset after generation so theme updates keep this feature.
const fs = require('node:fs');
const path = require('node:path');

hexo.extend.filter.register('after_generate', function () {
  this.route.set('js/third-party/comments/utterances.js',
    fs.readFileSync(path.join(this.base_dir, 'custom/post-interactions.js')));
});
