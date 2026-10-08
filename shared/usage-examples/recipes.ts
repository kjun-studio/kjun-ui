import type { UsageInput } from './builder';
import { RecipeBuilder } from './recipe-builder';
import { forms } from './recipe-forms';
import { lists } from './recipe-lists';
import { screens } from './recipe-screens';

export function generate(input: UsageInput) {
  const builder = new RecipeBuilder(input);
  const content = forms(builder) ?? lists(builder) ?? screens(builder);
  if (!content) throw Error('구현 코드 생성기 누락: ' + input.name);
  return builder.finish(content);
}
