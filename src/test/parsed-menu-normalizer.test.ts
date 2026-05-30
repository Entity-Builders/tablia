import { describe, expect, it } from 'vitest';
import { normalizeParsedMenu } from '../services/parsed-menu-normalizer';
import type { ParsedMenu } from '../types';

describe('normalizeParsedMenu', () => {
  it('diferencia variantes con el mismo nombre base', () => {
    const parsed: ParsedMenu = {
      categories: [
        {
          name: 'Platitos',
          items: [
            {
              name: 'PROVOLETA',
              description: 'Con morrones, rúcula, tomates secos y frescos',
              price: 14900,
              currency: 'ARS',
              tags: [],
            },
            {
              name: 'PROVOLETA',
              description: 'Con cebolla caramelizada y panceta ahumada',
              price: 17900,
              currency: 'ARS',
              tags: [],
            },
          ],
        },
      ],
    };

    const normalized = normalizeParsedMenu(parsed);

    expect(normalized.categories[0].items.map((item) => item.name)).toEqual([
      'PROVOLETA (morrones, rúcula, tomates secos y frescos)',
      'PROVOLETA (cebolla caramelizada y panceta ahumada)',
    ]);
  });

  it('elimina duplicados exactos dentro de una misma categoria', () => {
    const item = {
      name: 'BRUSCHETTAS',
      description: '2 unidades. De jamón serrano, rúcula y brie.',
      price: 13900,
      currency: 'ARS',
      tags: [],
    };

    const parsed: ParsedMenu = {
      categories: [{ name: 'Platitos', items: [item, { ...item }] }],
    };

    const normalized = normalizeParsedMenu(parsed);

    expect(normalized.categories[0].items).toHaveLength(1);
    expect(normalized.categories[0].items[0].name).toBe('BRUSCHETTAS');
  });

  it('tolera tags ausentes en respuestas incompletas de la IA', () => {
    const parsed = {
      categories: [
        {
          name: 'Entradas',
          items: [
            {
              name: 'Empanada',
              description: null,
              price: '950',
              currency: '',
            },
          ],
        },
      ],
    } as unknown as ParsedMenu;

    const normalized = normalizeParsedMenu(parsed);

    expect(normalized.categories[0].items[0]).toMatchObject({
      name: 'Empanada',
      description: undefined,
      price: 950,
      currency: 'ARS',
      tags: [],
    });
  });

  it('normaliza cargos adicionales y notas legales', () => {
    const parsed = {
      categories: [],
      additional_charges: [
        { label: ' Servicio de mesa ', price: '2400', currency: '' },
        { label: '', price: 100, currency: 'ARS' },
      ],
      legal_notes: ['  Todos los derechos reservados  ', ''],
    } as unknown as ParsedMenu;

    const normalized = normalizeParsedMenu(parsed);

    expect(normalized.additional_charges).toEqual([
      { label: 'Servicio de mesa', price: 2400, currency: 'ARS' },
    ]);
    expect(normalized.legal_notes).toEqual(['Todos los derechos reservados']);
  });
});
