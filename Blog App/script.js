
let shown = 6;      
let featured = 0;   
let currentPost = 0; 

const ARROW = '<svg width="34" height="8" viewBox="0 0 34 8" fill="none" stroke="currentColor"><path d="M0 4h33M29 1l4 3-4 3"/></svg>';
const CHIP = 'border border-line px-3 py-1.5 font-sans text-[11px] tracking-[.2em] uppercase hover:border-ink';

function $(id) { return document.getElementById(id); }   

function formatDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function escapeHtml(text) {          
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function findArticles(test) {
  const found = [];
  articles.forEach((a, i) => { if (test(a)) found.push(i); });
  return found;
}

function makeCard(i) {
  const a = articles[i];
  return `
    <article class="relative pl-[26px] text-center">
      <a href="#/cat/${a.category}" class="absolute left-0 top-0 [writing-mode:vertical-rl] rotate-180 font-sans font-medium text-[10px] tracking-[.28em] uppercase">${a.category}</a>
      <a href="#/post/${i}"><img src="${a.image}" alt="" loading="lazy" class="w-full aspect-square object-cover block"></a>
      <time class="block mt-[18px] font-sans text-[10px] tracking-[.2em] uppercase text-mute">${formatDate(a.date)}</time>
      <h3 class="font-serif font-medium text-[1.4rem] leading-tight mx-1.5 mt-2 mb-2.5"><a href="#/post/${i}">${a.title}</a></h3>
      <p class="text-base leading-[1.45] text-mute mx-1 mb-4 line-clamp-3">${a.excerpt}</p>
      <a href="#/post/${i}" class="font-serif italic font-medium text-base inline-flex items-center gap-3.5">Read More ${ARROW}</a>
    </article>`;
}

function showFeatured() {
  const a = articles[featured];
  $('featImg').src = a.image;
  $('featImgLink').href = '#/post/' + featured;
  $('featCategory').textContent = a.category;
  $('featCategory').href = '#/cat/' + a.category;
  $('featDate').textContent = formatDate(a.date);
  $('featTitle').textContent = a.title;
  $('featTitle').href = '#/post/' + featured;
  $('featText').textContent = a.excerpt + ' ' + a.text;
  $('featButton').href = '#/post/' + featured;
  document.querySelectorAll('.dot').forEach((dot, k) => dot.classList.toggle('on', k === featured));
}

function showList(list, title, subtitle, isHome) {
  $('listPage').classList.remove('hidden');
  $('postPage').classList.add('hidden');
  $('pageTitle').textContent = title;
  $('pageSubtitle').textContent = subtitle;

  $('featured').classList.toggle('hidden', !isHome);   
  if (isHome) {
    showFeatured();
    list = list.filter(i => i !== featured);         
  }

  $('cardGrid').innerHTML = list.slice(0, shown).map(makeCard).join('');
  $('emptyMsg').classList.toggle('hidden', list.length > 0);
  $('loadMoreBox').classList.toggle('hidden', list.length <= shown);
}

function showPost(i) {
  const a = articles[i];
  if (!a) { location.hash = '#/'; return; }
  currentPost = i;

  $('listPage').classList.add('hidden');
  $('postPage').classList.remove('hidden');

  $('postCategory').textContent = a.category;
  $('postCategory').href = '#/cat/' + a.category;
  $('postDate').textContent = formatDate(a.date);
  $('postReadTime').textContent = (3 + i % 4) + ' min read';
  $('postTitle').textContent = a.title;
  $('postExcerpt').textContent = a.excerpt;
  $('postImg').src = a.image;
  $('postText').textContent = a.text;
  document.title = a.title + ' – Marginalia';

  $('postTags').innerHTML = a.tags.map(t => `<a href="#/tag/${encodeURIComponent(t)}" class="${CHIP}">#${t}</a>`).join('');

  const link = encodeURIComponent(location.href);
  const title = encodeURIComponent(a.title);
  $('shareX').href = 'https://twitter.com/intent/tweet?text=' + title + '&url=' + link;
  $('shareFacebook').href = 'https://www.facebook.com/sharer/sharer.php?u=' + link;
  $('shareLinkedin').href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + link;
  $('shareWhatsapp').href = 'https://wa.me/?text=' + title + '%20' + link;

  showComments();
  showRelated(i);
}

function showRelated(i) {
  const me = articles[i];
  const scored = [];
  articles.forEach((a, k) => {
    if (k === i) return;
    let score = (a.category === me.category) ? 2 : 0;
    a.tags.forEach(t => { if (me.tags.includes(t)) score++; });
    scored.push({ k, score });
  });
  scored.sort((x, y) => y.score - x.score);
  $('relatedGrid').innerHTML = scored.slice(0, 3).map(s => makeCard(s.k)).join('');
}

function getComments() {
  try { return JSON.parse(localStorage.getItem('comments' + currentPost)) || []; }
  catch (e) { return []; }
}

function showComments() {
  const list = getComments();
  if (list.length === 0) {
    $('comments').innerHTML = '<p class="text-mute text-center pb-4">No comments yet. Start the conversation.</p>';
    return;
  }
  $('comments').innerHTML = list.map(c => `
    <div class="border border-line bg-card px-[18px] py-3.5 mb-3">
      <b class="font-sans font-medium text-[13px] tracking-[.1em]">${escapeHtml(c.name)}</b>
      <span class="font-sans text-[10px] tracking-[.2em] uppercase text-mute">${c.date}</span>
      <div>${escapeHtml(c.text)}</div>
    </div>`).join('');
}

$('commentForm').onsubmit = function (e) {
  e.preventDefault();                                   
  const name = $('nameInput').value.trim();
  const text = $('textInput').value.trim();
  if (name === '' || text === '') {
    $('formError').textContent = 'Add your name and a comment to post.';
    return;
  }
  $('formError').textContent = '';
  const list = getComments();
  list.push({ name: name, text: text, date: new Date().toLocaleDateString('en-IN') });
  try { localStorage.setItem('comments' + currentPost, JSON.stringify(list)); } catch (e) {}
  showComments();
  this.reset();
};

$('copyBtn').onclick = function () {
  navigator.clipboard.writeText(location.href).then(
    () => { this.textContent = 'Copied'; },
    () => { this.textContent = 'Copy failed'; }
  );
};


function route(keepPosition) {
  const parts = location.hash.replace('#/', '').split('/');
  const page = parts[0];
  const value = decodeURIComponent(parts.slice(1).join('/'));

  if (!keepPosition) shown = 6;
  document.title = 'Marginalia – a blog about design, code and slow travel';
  $('menu').classList.add('hidden');                    // close phone menu

  const current = (page === 'cat') ? value : (page === '' ? 'All' : '');
  document.querySelectorAll('.nav-link, .browse-link').forEach(l => l.classList.toggle('on', l.dataset.name === current));

  if (page === 'post') {
    showPost(Number(value));
  } else if (page === 'cat') {
    const list = findArticles(a => a.category === value);
    showList(list, value, list.length + ' articles', false);
  } else if (page === 'tag') {
    const list = findArticles(a => a.tags.includes(value));
    showList(list, 'Tagged #' + value, list.length + ' articles', false);
  } else if (page === 'search') {
    const word = value.toLowerCase();
    const list = findArticles(a => (a.title + a.excerpt + a.category + a.tags.join(' ')).toLowerCase().includes(word));
    showList(list, 'Results for “' + value + '”', list.length + ' articles', false);
  } else {
    showList(findArticles(() => true), 'The Blog', 'Notes on design, code and slow travel', true);
  }

  if (!keepPosition) window.scrollTo(0, 0);
}

$('loadMoreBtn').onclick = () => { shown += 6; route(true); };

document.querySelectorAll('.dot').forEach((dot, k) => {
  dot.onclick = () => { featured = k; shown = 6; route(true); };
});

$('searchForm').onsubmit = function (e) {
  e.preventDefault();
  const word = $('searchInput').value.trim();
  location.hash = word ? '#/search/' + encodeURIComponent(word) : '#/';
};

$('menuBtn').onclick = () => $('menu').classList.toggle('hidden');

function isDark() {
  const saved = document.documentElement.dataset.theme;
  return saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
}
function updateThemeButton() { $('themeBtn').textContent = isDark() ? 'Light' : 'Dark'; }

try { const saved = localStorage.getItem('theme'); if (saved) document.documentElement.dataset.theme = saved; } catch (e) {}

$('themeBtn').onclick = function () {
  const next = isDark() ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch (e) {}
  updateThemeButton();
};
const allTags = [];
articles.forEach(a => a.tags.forEach(t => { if (!allTags.includes(t)) allTags.push(t); }));
$('tagList').innerHTML = allTags.map(t => `<a href="#/tag/${encodeURIComponent(t)}" class="${CHIP}">#${t}</a>`).join('');

updateThemeButton();
window.addEventListener('hashchange', () => route());   
route();                                                 