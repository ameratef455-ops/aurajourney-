import fs from 'fs';

const filePath = 'src/components/Maps.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Add state
content = content.replace(
  "const [reviewingTask, setReviewingTask] = useState<any>(null);",
  "const [reviewingTask, setReviewingTask] = useState<any>(null);\n  const [flashcardTask, setFlashcardTask] = useState<any>(null);"
);

// We need to inject the button. Let's find all instances of `<span className="text-[9px] font-bold mx-1">راجع</span>` and its parent closing button, or just replace `title="مراجعة الأنشطة"` blocks.
// Wait, one of them has `<span className="text-[9px] font-bold">راجع</span>`. Let's use a regex to match the button that ends with `</button>` and the next button which is analytics.

// Actually, the button is inside a <div className="flex gap-1" ...>. We can replace `title="مراجعة الأنشطة"` -> `title="مراجعة الأنشطة"` and insert the flashcard button before or after.
// We can use a regex to replace `title="مراجعة الأنشطة"` to something that we can split by.
// Better: regex for the closing tag of "مراجعة الأنشطة" button!
const addBtn = (taskVar) => `</button><button type="button" onClick={(e) => { e.stopPropagation(); setFlashcardTask(${taskVar}); }} className="p-1 px-1.5 bg-sky-50 border border-sky-100/50 hover:bg-sky-100 text-sky-600 transition-all rounded-lg flex items-center justify-center shrink-0 cursor-pointer shadow-3xs hover:scale-105" title="كروت"><i className="pi pi-images text-[10px]"></i></button>`;

content = content.replace(/<button[^>]*title="مراجعة الأنشطة"[^>]*>[\s\S]*?<\/button>/g, match => {
  // We need the task variable name. It's usually inside `setReviewingTask(TASK_VAR)`.
  const m = match.match(/setReviewingTask\(([^)]+)\)/);
  if (m) {
    const taskVar = m[1];
    return match + `<button type="button" onClick={(e) => { e.stopPropagation(); setFlashcardTask(${taskVar}); }} className="p-1 px-1.5 bg-sky-50 border border-sky-100/50 hover:bg-sky-100 text-sky-600 transition-all rounded-lg flex items-center justify-center shrink-0 cursor-pointer shadow-3xs hover:scale-105" title="كروت"><i className="pi pi-clone text-[10px]"></i></button>`;
  }
  return match;
});

// We need to add the Flashcard modal. We can just add it before the last `</>` closing tag.
// But first, let's create a separate component to keep it clean. Wait, it needs `db` and it's easier to put inside `Maps.tsx` or as a separate file and import it.
// I'll create `FlashcardsModal.tsx` and import it.

const importStatement = `import { FlashcardsModal } from "./FlashcardsModal";`;
if (!content.includes(importStatement)) {
  content = content.replace(`import { TaskReviewModal }`, `import { FlashcardsModal }\nfrom "./FlashcardsModal";\nimport { TaskReviewModal }`);
}

// Render the modal
const renderModal = `
      {flashcardTask && (
        <FlashcardsModal
          visible={!!flashcardTask}
          onHide={() => setFlashcardTask(null)}
          task={flashcardTask}
        />
      )}
`;

content = content.replace("{reviewingTask && (", renderModal + "\n{reviewingTask && (");

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Updated Maps.tsx successfully");
