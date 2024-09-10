import React, { useState, useEffect } from "react";
import { marked } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/github.css"; // You can choose any style you like

import "./App.css";

function parseVariable(input) {
  // Define a regular expression pattern to match valid variable names
  const pattern = /^var\s+([a-zA-Z_][a-zA-Z0-9_]*)$/;

  // Match the input against the pattern
  const match = input.match(pattern);

  // If there is a match, return the variable name; otherwise, return undefined
  return match ? match[1] : undefined;
}

const vars = {};

function App() {
  const [markdown, setMarkdown] = useState("");

  const walkTokens = (token) => {
    if (token.type === 'code') {
      const { text, lang } = token
      if (lang !== undefined) {
        const variable = parseVariable(lang)

        if (variable !== undefined) {
          const value = text

          if (value !== undefined && vars[variable] !== value && value !== "") {
            // console.log("setting variable", variable, "to", value)
            vars[variable] = value
          }
        }
      }

      if (text.includes("$")) {
        const regex = /\$([a-zA-Z_][a-zA-Z0-9_]*)/g;
        const matches = [...text.matchAll(regex)];
        for (const match of matches) {
          const variable = match[1];
          if (vars[variable] !== undefined) {
            token.text = text.replace(match[0], vars[variable]);
          }
        }
      }
    }
  };

  // Configure marked to use highlight.js for code highlighting
  marked.setOptions({
    breaks: true, // Optional: to handle line breaks
    highlight: function (code, language) {
      const validLanguage = hljs.getLanguage(language) ? language : "plaintext";
      return hljs.highlight(validLanguage, code).value;
    },
  });
  
  marked.use({ walkTokens });

  const convertToHTML = (md) => {
    return marked(md);
  };

  useEffect(() => {
    const codeBlocks = document.querySelectorAll("pre");
  
    codeBlocks.forEach((block) => {
      // Check if block already contains the copy prompt to avoid duplications
      if (block.querySelector(".copy-prompt")) return;
  
      // Create the copy prompt element
      const copyPrompt = document.createElement("div");
      copyPrompt.className = "copy-prompt";
  
      // Create the copy icon element
      const copyIcon = document.createElement("img");
      copyIcon.src = "copy.svg";
      copyIcon.alt = "Copy code"; // Accessibility improvement
      copyIcon.style.height = "20px";
      copyIcon.style.width = "20px";
  
      copyPrompt.appendChild(copyIcon);
      block.appendChild(copyPrompt);
  
      // Add click event listener to copy code to clipboard
      copyPrompt.addEventListener("click", () => {
        const codeText = block.querySelector("code")?.textContent || ""; // Safely get code text
        navigator.clipboard.writeText(codeText).then(() => {
          copyPrompt.textContent = "Copied!"; // Update the text to indicate the copy action
          setTimeout(() => {
            copyPrompt.textContent = ""; // Reset the text
            copyPrompt.appendChild(copyIcon); // Reattach the icon
          }, 1000);
        }).catch(() => {
          copyPrompt.textContent = "Failed to copy"; // Error handling
          setTimeout(() => copyPrompt.textContent = "", 1000);
        });
      });
    });
  }, [markdown]);
  

  return (
    <div className="app">
      <div className="editor-pane">
        <textarea
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          placeholder="Enter markdown..."
        />
      </div>
      <div className="preview-pane">
        <div
          className="preview-content"
          dangerouslySetInnerHTML={{ __html: convertToHTML(markdown) }}
        />
      </div>
    </div>
  );
}

export default App;