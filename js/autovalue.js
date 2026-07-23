// /reitansai/js/autovalue.js
document.addEventListener('DOMContentLoaded', function() {
    const JSON_PATH = '/reitansai/json/autovalue.json';
    
    // 現在のページのURLパスを取得（index.html や second.html など）
    let currentPath = window.location.pathname;
    // 末尾の / を除去し、ファイル名だけにする（柔軟対応）
    if (currentPath.endsWith('/')) {
        currentPath = currentPath.slice(0, -1);
    }
    const currentFile = currentPath.split('/').pop() || 'index.html';

    fetch(JSON_PATH)
        .then(response => {
            if (!response.ok) throw new Error('JSONファイルが見つかりません');
            return response.json();
        })
        .then(data => {
            // data が配列として格納されている前提
            const pageData = data.find(item => item.url === currentFile);
            if (!pageData || !pageData.value) {
                console.warn(`ページ ${currentFile} に対応するデータが見つかりません`);
                return;
            }

            const values = pageData.value;
            
            // data-value属性を持つすべての要素を処理
            const elements = document.querySelectorAll('[data-value]');
            
            elements.forEach(el => {
                const dataValue = el.getAttribute('data-value').trim();
                if (!dataValue) return;
                
                // "key type1 type2 ..." の形式で解析
                const parts = dataValue.split(/\s+/);
                const key = parts[0];
                const types = parts.slice(1); // 残りがタイプ指定
                
                if (!values[key]) {
                    console.warn(`キー ${key} が見つかりません`);
                    return;
                }
                
                const val = values[key];
                
                // タイプに応じた処理
                if (types.includes('txt') || types.includes('text')) {
                    // テキストコンテンツ
                    el.textContent = val;
                }
                else if (types.includes('htm') || types.includes('html')) {
                    // HTML挿入
                    el.innerHTML = val;
                }
                else if (types.includes('url') && el.tagName === 'IMG') {
                    // 画像 src
                    el.src = val;
                }
                else if (types.includes('url') && el.tagName === 'A') {
                    // リンク
                    if (typeof val === 'object' && val.url) {
                        el.href = val.url;
                        if (val.text) {
                            el.textContent = val.text;
                        }
                    } else if (typeof val === 'string') {
                        el.href = val;
                    }
                }
                else if (types.length === 0) {
                    // タイプ指定なしの場合は要素の種類で自動判定
                    if (el.tagName === 'IMG') {
                        el.src = val;
                    } else if (el.tagName === 'A') {
                        if (typeof val === 'object') {
                            el.href = val.url || '';
                            el.textContent = val.text || '';
                        } else {
                            el.href = val;
                        }
                    } else {
                        el.textContent = val;
                    }
                }
            });
            
            console.log('AutoValue: ページ内容を自動設定しました');
        })
        .catch(error => {
            console.error('AutoValue エラー:', error);
        });
});
