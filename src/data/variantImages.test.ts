import { variantImageUrl } from './variantImages';

describe('variantImageUrl', () => {
  it('is null for a printing without an imported image and for prototype names', () => {
    expect(variantImageUrl('no-such__set-001')).toBeNull();
    expect(variantImageUrl('__proto__')).toBeNull();
  });
});
