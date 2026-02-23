import { useState } from 'react';
import type { ParsedMenu } from '../types';
import {
  Trash2,
  GripVertical,
  Tag,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
import './MenuReview.css';

interface MenuReviewProps {
  parsedMenu: ParsedMenu;
  onConfirm: (editedMenu: ParsedMenu) => void;
  confirmLabel?: string;
}

const AVAILABLE_TAGS = [
  'vegano',
  'vegetariano',
  'sin-tacc',
  'sin-gluten',
  'picante',
  'para-compartir',
  'sin-lactosa',
  'casero',
];

export function MenuReview({
  parsedMenu,
  onConfirm,
  confirmLabel,
}: MenuReviewProps) {
  const [menu, setMenu] = useState<ParsedMenu>(
    JSON.parse(JSON.stringify(parsedMenu)),
  );
  const [expandedCat, setExpandedCat] = useState<number | null>(0);
  const [confirming, setConfirming] = useState(false);

  const updateItemField = (
    catIdx: number,
    itemIdx: number,
    field: string,
    value: string | number | string[],
  ) => {
    const updated = { ...menu };
    const categories = [...updated.categories];
    const items = [...categories[catIdx].items];
    items[itemIdx] = { ...items[itemIdx], [field]: value };
    categories[catIdx] = { ...categories[catIdx], items };
    updated.categories = categories;
    setMenu(updated);
  };

  const updateCategoryName = (catIdx: number, name: string) => {
    const updated = { ...menu };
    const categories = [...updated.categories];
    categories[catIdx] = { ...categories[catIdx], name };
    updated.categories = categories;
    setMenu(updated);
  };

  const removeItem = (catIdx: number, itemIdx: number) => {
    const updated = { ...menu };
    const categories = [...updated.categories];
    const items = categories[catIdx].items.filter((_, i) => i !== itemIdx);
    categories[catIdx] = { ...categories[catIdx], items };
    updated.categories = categories;
    setMenu(updated);
  };

  const toggleTag = (catIdx: number, itemIdx: number, tag: string) => {
    const item = menu.categories[catIdx].items[itemIdx];
    const tags = item.tags.includes(tag)
      ? item.tags.filter((t) => t !== tag)
      : [...item.tags, tag];
    updateItemField(catIdx, itemIdx, 'tags', tags);
  };

  const handleConfirm = async () => {
    setConfirming(true);
    await onConfirm(menu);
    setConfirming(false);
  };

  const totalItems = menu.categories.reduce(
    (sum, cat) => sum + cat.items.length,
    0,
  );

  return (
    <div className='menu-review'>
      <div className='menu-review__summary'>
        <span>{menu.categories.length} secciones</span>
        <span>·</span>
        <span>{totalItems} platos</span>
      </div>

      <div className='menu-review__categories'>
        {menu.categories.map((cat, catIdx) => (
          <div key={catIdx} className='menu-review__category'>
            {/* Category header */}
            <button
              className='menu-review__cat-header'
              onClick={() =>
                setExpandedCat(expandedCat === catIdx ? null : catIdx)
              }
            >
              <GripVertical size={16} className='menu-review__grip' />
              <input
                className='menu-review__cat-name'
                value={cat.name}
                onChange={(e) => updateCategoryName(catIdx, e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              <span className='menu-review__cat-count'>{cat.items.length}</span>
              {expandedCat === catIdx ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </button>

            {/* Items */}
            {expandedCat === catIdx && (
              <div className='menu-review__items'>
                {cat.items.map((item, itemIdx) => (
                  <div key={itemIdx} className='menu-review__item'>
                    <div className='menu-review__item-main'>
                      <input
                        className='menu-review__item-name'
                        value={item.name}
                        onChange={(e) =>
                          updateItemField(
                            catIdx,
                            itemIdx,
                            'name',
                            e.target.value,
                          )
                        }
                      />
                      <div className='menu-review__item-price'>
                        <span className='menu-review__currency'>$</span>
                        <input
                          type='number'
                          className='menu-review__price-input'
                          value={item.price}
                          onChange={(e) =>
                            updateItemField(
                              catIdx,
                              itemIdx,
                              'price',
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                      </div>
                      <button
                        className='menu-review__remove'
                        onClick={() => removeItem(catIdx, itemIdx)}
                        title='Eliminar plato'
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {item.description && (
                      <input
                        className='menu-review__item-desc'
                        value={item.description}
                        onChange={(e) =>
                          updateItemField(
                            catIdx,
                            itemIdx,
                            'description',
                            e.target.value,
                          )
                        }
                        placeholder='Descripción...'
                      />
                    )}

                    {/* Tags */}
                    <div className='menu-review__tags'>
                      <Tag size={12} />
                      {AVAILABLE_TAGS.map((tag) => (
                        <button
                          key={tag}
                          className={`menu-review__tag ${
                            item.tags.includes(tag)
                              ? 'menu-review__tag--active'
                              : ''
                          }`}
                          onClick={() => toggleTag(catIdx, itemIdx, tag)}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {cat.items.length === 0 && (
                  <p className='menu-review__empty'>
                    No hay platos en esta sección.
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        className='menu-review__confirm'
        onClick={handleConfirm}
        disabled={confirming}
      >
        {confirming ? (
          'Publicando...'
        ) : (
          <>
            <Check size={18} />
            {confirmLabel || 'Confirmar y publicar menú'}
          </>
        )}
      </button>
    </div>
  );
}
