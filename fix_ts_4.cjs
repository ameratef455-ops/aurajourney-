const fs = require('fs');

let f = fs.readFileSync('src/components/ReviewPathSession.tsx', 'utf-8');

// replace the end of finalizeCompletedActivity
f = f.replace(`    if (allActivitiesCompleted) {
      vibrate(HAPITCS.SUCCESS);
      confetti({
        zIndex: 999999999,
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
      });
      toast.success("أحسنت! أنهيت جميع الأنشطة بنجاح 🏆 نلت +10 XP!");
      if (onOpenReviewReflection) {
        onOpenReviewReflection(task);
      } else if (onOpenReflection) {
        onOpenReflection(task);
      }
      onClose();
    } else {
      toast.success("تم إتمام وإنهاء النشاط بنجاح! 🎉 نلت +10 XP!");
    }`, `    if (allActivitiesCompleted) {
      vibrate(HAPITCS.SUCCESS);
      confetti({
        zIndex: 999999999,
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
      });
      toast.success("أحسنت! أنهيت جميع الأنشطة بنجاح 🏆 نلت +10 XP!");
      onClose();
    } else {
      toast.success("تم إتمام وإنهاء النشاط بنجاح! 🎉 نلت +10 XP!");
    }

    if (onOpenReviewReflection) {
      onOpenReviewReflection(task);
    } else if (onOpenReflection) {
      onOpenReflection(task);
    }`);

fs.writeFileSync('src/components/ReviewPathSession.tsx', f);
console.log('Fixed finalizeCompletedActivity');
