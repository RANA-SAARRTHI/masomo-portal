export function gradeFor(percentage: number): { grade: string; remark: string } {
  if (percentage >= 80) return { grade: "A", remark: "Excellent" };
  if (percentage >= 70) return { grade: "B", remark: "Very Good" };
  if (percentage >= 60) return { grade: "C", remark: "Good" };
  if (percentage >= 50) return { grade: "D", remark: "Satisfactory" };
  if (percentage >= 40) return { grade: "E", remark: "Needs Improvement" };
  return { grade: "F", remark: "Fail" };
}
