// List of exception words
const exceptionWords = [
  "about", "again", "among", "around", "because", "before",
  "between", "beyond", "could", "during", "every", "having", "however",
  "instead", "little", "might", "other", "rather",
  "should", "since", "some", "still", "there", "these", "those",
  "until", "while", "where", "which", "would", "within", "without",
  "and", "the", "for", "are", "but", "not", "you", "all", "any", "can", "her",
  "was", "one", "our", "out", "day", "get", "has", "him", "his", "how", "add"
];

let fontWeight = 700;



// Fetch the font weight from the storage
const fetchFontWeight = () => {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["fontWeight"], (result) => {
      if (result.fontWeight !== undefined) {
        resolve(result.fontWeight);
        console.log(result.fontWeight);
      } else {
        chrome.storage.sync.set({ fontWeight: 700 });
        console.log('Font weight not found, setting default 700');
        resolve(700);
      }
    });
  });
};

// Set the checkbox state based on the stored font weight
fetchFontWeight().then((weight) => {
  const checkbox = document.getElementById('fontWeightCheckbox');
  if (checkbox) {
    checkbox.checked = (weight === 700);
  }
});


document.addEventListener('DOMContentLoaded', () => {
  const checkbox = document.getElementById('fontWeightCheckbox');
  if (checkbox) {
    checkbox.addEventListener('change', (event) => {
      fontWeight = event.target.checked ? 700 : null;
      chrome.storage.sync.set({ fontWeight: fontWeight }, () => {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          if (tabs.length > 0) {
              chrome.tabs.reload(tabs[0].id);
          }
        }); // Refresh the page to apply the new font weight
      });
    });
  } else {
    console.error('Checkbox element not found');
  }
});

function boldFirstTwoLetters(node, adjustedFontWeight) {
  if (node.nodeType === Node.TEXT_NODE) {
    const textContent = node.nodeValue.trim();
    console.log(textContent);
    if (textContent.length <= 100) {
      return; // Do not manipulate the font if the text is 50 characters or less
    }

    const words = textContent.split(/\s+/);
    const formattedWords = words.map(word => {
      // Check if the word is in the exception list (case insensitive)
      if (exceptionWords.includes(word.toLowerCase())) {
        return word; // Leave the word unchanged
      }
      if (word.length > 8) {
        return `<span style="font-weight: ${adjustedFontWeight};">${word.slice(0, 4)}</span>${word.slice(4)}`;
      }
      if (word.length > 6) {
        return `<span style="font-weight: ${adjustedFontWeight};">${word.slice(0, 3)}</span>${word.slice(3)}`;
      }
      if (word.length > 2) {
        return `<span style="font-weight: ${adjustedFontWeight};">${word.slice(0, 2)}</span>${word.slice(2)}`;
      }
      return word; // Leave short words unchanged
    });
    const span = document.createElement('span');
    span.innerHTML = formattedWords.join(' ');
    node.parentNode.replaceChild(span, node);
  }
}

function walkDOM(node) {
  fetchFontWeight().then((weight) => {
    fontWeight = weight;
    if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim()) {
      boldFirstTwoLetters(node, fontWeight);
    } else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE') {
      Array.from(node.childNodes).forEach(child => {
        if (child) {
          walkDOM(child);
        }
      });
    }
  });
}



// Initial processing of the document body
fetchFontWeight().then((weight) => {
  if (weight === 700) {
    walkDOM(document.body);
  }
});
