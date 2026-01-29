/**
 * 敏感词检测工具
 * 检测用户输入是否包含敏感词，如果包含则返回拦截响应
 */

const SENSITIVE_KEYWORDS = ["六四", "天安门", "共产党"];

/**
 * 检测用户输入是否包含敏感词
 * @param userInput 用户输入内容
 * @returns 如果包含敏感词返回拦截响应，否则返回null
 */
export function checkSensitiveContent(userInput: string): string | null {
  if (!userInput || typeof userInput !== "string") {
    return null;
  }

  const normalizedInput = userInput.trim();
  
  // 检查是否包含敏感词
  const containsSensitiveKeyword = SENSITIVE_KEYWORDS.some((keyword) =>
    normalizedInput.includes(keyword)
  );

  if (containsSensitiveKeyword) {
    return "抱歉，这个领域我还不了解，请换个话题问问吧";
  }

  return null;
}
