
    document.addEventListener("DOMContentLoaded", function () {
      const emojiButtons = document.querySelectorAll('.emoji-btn');
      const textarea = document.getElementById('updateContent');

      emojiButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          textarea.value += btn.textContent;
          textarea.focus();
        });
      });
    });
 