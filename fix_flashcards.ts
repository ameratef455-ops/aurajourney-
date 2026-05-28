import fs from 'fs';

const filePath = 'src/components/Maps.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Inject <FlashcardsModal />
if (!content.includes('<FlashcardsModal')) {
  const renderModal = `
      {flashcardTask && (
        <FlashcardsModal
          visible={!!flashcardTask}
          onHide={() => setFlashcardTask(null)}
          task={flashcardTask}
        />
      )}
`;
  content = content.replace("<TaskReviewModal", renderModal + "\n      <TaskReviewModal");
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Fixed Maps.tsx successfully");
