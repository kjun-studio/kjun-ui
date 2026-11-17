import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

const box = async (page: Page, section: string, text: string) => (await page.getByTestId(section).getByText(text, { exact: true }).boundingBox())!;
const look = (page: Page, section: string, text: string) => page.getByTestId(section).getByText(text, { exact: true }).evaluate(node => {
  const style = getComputedStyle(node.closest('.kjun-list-title, .kjun-list-trailing') ?? node);
  return { color: style.color, weight: Number(style.fontWeight), size: parseFloat(style.fontSize) };
});

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: a details section reads label and value, wraps long values from their start and closes on an emphasized total`, async ({ page }) => {
    await openFixture(page, platform, '', 'list-details');
    const section = (await page.getByTestId('details').boundingBox())!;
    // Rows are 32 tall: the two short rows start 32 apart.
    const method = await box(page, 'details', '결제 수단'), approval = await box(page, 'details', '승인 번호');
    expect(Math.round(approval.y - method.y)).toBe(32);
    // The value is heavier than the label and in another color; in a default section the title is the heavier one.
    const label = await look(page, 'details', '결제 수단'), value = await look(page, 'details', '신한카드 (1234)');
    expect(value.weight).toBeGreaterThan(label.weight);
    expect(value.color).not.toBe(label.color);
    const plainTitle = await look(page, 'default', '결제 수단'), plainValue = await look(page, 'default', '신한카드 (1234)');
    expect(plainTitle.weight).toBeGreaterThan(plainValue.weight);
    // A short value keeps the row's end line (16 from the section's end), on the label's line.
    const card = (await box(page, 'details', '신한카드 (1234)')), number = await box(page, 'details', '30418827');
    expect(Math.abs(card.x + card.width - (number.x + number.width))).toBeLessThan(1);
    expect(section.x + section.width - (card.x + card.width)).toBeCloseTo(16, 0);
    expect(Math.abs(card.y - method.y)).toBeLessThan(3);
    // A long value takes more than the 35% a default row's value gets, wraps and reads from its start, still ending on
    // the end line; the label keeps its first line beside the value's first line.
    const address = await box(page, 'details', '서울특별시 성동구 왕십리로 222, 한양대학교 제1공학관 304호'), addressLabel = await box(page, 'details', '배송지');
    expect(address.width).toBeGreaterThan(section.width * 0.45);
    expect(address.height).toBeGreaterThan(30);
    expect(section.x + section.width - (address.x + address.width)).toBeLessThan(17);
    expect(Math.abs(address.y - addressLabel.y)).toBeLessThan(3);
    // trailingPosition="below": the value starts under its label, on the label's start line.
    const memoLabel = await box(page, 'details', '배송 메모'), memo = await box(page, 'details', '문 앞에 두고 벨은 누르지 말아 주세요. 공동현관 비밀번호는 없습니다.');
    expect(memo.y).toBeGreaterThan(memoLabel.y + memoLabel.height - 1);
    expect(Math.abs(memo.x - memoLabel.x)).toBeLessThan(1);
    // The emphasized total: larger value, heavier label in the value's color.
    const totalLabel = await look(page, 'details', '총 결제 금액'), total = await look(page, 'details', '29,000원');
    expect(total.size).toBe(20);
    expect(totalLabel.weight).toBeGreaterThan(label.weight);
    expect(totalLabel.color).toBe(value.color);
  });
}
