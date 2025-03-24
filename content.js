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
        console.log(`Font weight:${result.fontWeight}`);
        resolve(result.fontWeight);
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


// Fetch the text body size from the storage
const fetchTextBodySize = () => {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["textBodySize"], (result) => {
      if (result.textBodySize !== undefined) {
        console.log(`Text body size: ${result.textBodySize}`);
        resolve(result.textBodySize);
      } else {
        chrome.storage.sync.set({ textBodySize: 50 });
        console.log('Text body size not found, setting default 50');
        resolve(50);
      }
    });
  });
};

// Set the slider value based on the stored text body size
fetchTextBodySize().then((size) => {
  const slider = document.getElementById('textBodySizeSlider');
  if (slider) {
    slider.value = size;
  }
});

// Listen for changes in the checkbox state
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

// Listen for changes in the slider value
document.addEventListener('DOMContentLoaded', () => {
  const slider = document.getElementById('textBodySizeSlider');
  let sliderTimeout;

  if (slider) {
    slider.addEventListener('input', (event) => {
      clearTimeout(sliderTimeout); // Clear any existing timeout
      sliderTimeout = setTimeout(() => {
        let size = slider.min - event.target.value + parseInt(slider.max);
        chrome.storage.sync.set({ textBodySize: size }, () => {
          chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs.length > 0) {
                chrome.tabs.reload(tabs[0].id);
            }
          }); // Refresh the page to apply the new text body size
        });
      }, 300); // Wait 300ms after the user stops dragging
    });
  } else {
    console.error('Slider element not found');
  }
});

// Function to execute the bolding process
async function boldFirstTwoLetters(node, adjustedFontWeight) {
  if (node.nodeType === Node.TEXT_NODE) {
    const textContent = node.nodeValue.trim();
    const size = await fetchTextBodySize().catch((error) => {
      console.error('Error fetching text body size:', error);
      return 50; // Default size in case of an error
    });
    if (textContent.length <= size) {
      return; // Change this value to adjust the minimum length of the text to be bold
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

// Function to walk the DOM and bold each text node
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
