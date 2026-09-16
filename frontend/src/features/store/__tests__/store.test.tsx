import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { backgroundTheme, bubbleTheme, entryStyle, frameColors } from '../cosmetics';
import { StoreItemCard } from '../StoreItemCard';
import type { StoreItemDto } from '../../../api/types';

const base: StoreItemDto = {
  code: 'frame_royal_4',
  kind: 'Frame',
  name: 'Royal 4 Frame',
  assetUrl: '/assets/store/frame/royal_4.png',
  previewUrl: null,
  unlockRule: 'RoyalLevel',
  unlockValue: 4,
  unlockBoard: null,
  unlockLabel: 'Royal 4',
  heartsPrice: null,
  isOwned: false,
  isEquipped: false,
  isLocked: true,
  lockReason: 'Royal 4',
  isNew: false,
};

describe('cosmetics', () => {
  it('falls back to defaults for unknown or missing codes', () => {
    expect(frameColors(null)).toBeNull();
    expect(frameColors('frame_nope')).toBeNull();
    expect(frameColors('frame_royal_6')).toHaveLength(2);
    expect(bubbleTheme(undefined)).toBeNull();
    expect(bubbleTheme('chatbubble_gold_scroll')?.borderColor).toBeTruthy();
    expect(backgroundTheme(null).label).toBe('Night City');
    expect(backgroundTheme('background_club_20').label).toBe('Sunset Beach');
    expect(entryStyle('entrystyle_jet')?.label).toBe('Private Jet');
    expect(entryStyle('entrystyle_default')).toBeNull();
  });
});

describe('StoreItemCard', () => {
  it('shows the lock reason for locked items', async () => {
    await render(<StoreItemCard item={base} onPress={jest.fn()} onUse={jest.fn()} />);
    expect(screen.getByText('Royal 4')).toBeTruthy();
    expect(screen.queryByText('Use')).toBeNull();
  });

  it('offers Use for owned items and calls back with the item', async () => {
    const onUse = jest.fn();
    await render(<StoreItemCard item={{ ...base, isOwned: true, isLocked: false, lockReason: null }} onPress={jest.fn()} onUse={onUse} />);
    await fireEvent.press(screen.getByLabelText('Use Royal 4 Frame'));
    expect(onUse).toHaveBeenCalledWith(expect.objectContaining({ code: 'frame_royal_4' }));
  });

  it('marks the equipped item as selected', async () => {
    await render(<StoreItemCard item={{ ...base, isOwned: true, isEquipped: true, isLocked: false, lockReason: null }} onPress={jest.fn()} onUse={jest.fn()} />);
    expect(screen.getByLabelText('Royal 4 Frame, selected')).toBeTruthy();
    expect(screen.queryByText('Use')).toBeNull();
  });

  it('shows the hearts price for purchasable items', async () => {
    await render(<StoreItemCard item={{ ...base, unlockRule: 'Purchase', heartsPrice: 1500, isLocked: false, lockReason: 'Purchase' }} onPress={jest.fn()} onUse={jest.fn()} />);
    expect(screen.getByText('1,500')).toBeTruthy();
  });
});
