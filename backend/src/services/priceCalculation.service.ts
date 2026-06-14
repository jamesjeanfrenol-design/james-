import { Product } from '../models/Product';
import { ProductUnitConversion } from '../models/ProductUnitConversion';
import { AppDataSource } from '../config/database';

/**
 * Calcule le prix unitaire pour une unité donnée d'un produit
 * @param product Le produit
 * @param unitId L'ID de l'unité pour laquelle calculer le prix
 * @param conversions Les conversions d'unités du produit (optionnel, sera chargé si non fourni)
 * @returns Le prix unitaire dans l'unité demandée
 */
export async function calculateUnitPrice(
  product: Product,
  unitId: number,
  conversions?: ProductUnitConversion[]
): Promise<number> {
  // Si pas de conversions fournies, les charger
  if (!conversions) {
    const conversionRepository = AppDataSource.getRepository(ProductUnitConversion);
    conversions = await conversionRepository.find({
      where: { productId: product.id },
      relations: ['unit'],
    });
  }

  // Trouver la conversion pour cette unité
  const conversion = conversions.find(c => c.unitId === unitId);
  if (!conversion) {
    // Si pas de conversion trouvée, retourner le prix de base (supposé être dans l'unité principale)
    return parseFloat(String(product.price)) || 0;
  }

  // Si un prix personnalisé est défini, l'utiliser
  if (conversion.customPrice !== null && conversion.customPrice !== undefined) {
    return parseFloat(String(conversion.customPrice));
  }

  // Sinon, calculer à partir du prix de base et du ratio
  // Le prix de base est dans la plus petite unité (ratio = 1)
  const basePrice = parseFloat(String(product.price)) || 0;
  const ratio = parseFloat(String(conversion.conversionRatio)) || 1;
  
  return basePrice * ratio;
}

/**
 * Calcule la quantité dans l'unité de base à partir d'une quantité dans une unité donnée
 * @param quantity La quantité dans l'unité donnée
 * @param unitId L'ID de l'unité utilisée
 * @param conversions Les conversions d'unités du produit
 * @returns La quantité dans l'unité de base (plus petite unité)
 */
export function convertToBaseUnit(
  quantity: number,
  unitId: number,
  conversions: ProductUnitConversion[]
): number {
  const conversion = conversions.find(c => c.unitId === unitId);
  if (!conversion) {
    return quantity; // Par défaut, supposer que c'est déjà dans l'unité de base
  }

  const ratio = parseFloat(String(conversion.conversionRatio)) || 1;
  return quantity * ratio;
}

/**
 * Calcule la quantité dans une unité cible à partir d'une quantité dans l'unité de base
 * @param baseQuantity La quantité dans l'unité de base
 * @param targetUnitId L'ID de l'unité cible
 * @param conversions Les conversions d'unités du produit
 * @returns La quantité dans l'unité cible
 */
export function convertFromBaseUnit(
  baseQuantity: number,
  targetUnitId: number,
  conversions: ProductUnitConversion[]
): number {
  const conversion = conversions.find(c => c.unitId === targetUnitId);
  if (!conversion) {
    return baseQuantity; // Par défaut, retourner la quantité de base
  }

  const ratio = parseFloat(String(conversion.conversionRatio)) || 1;
  return baseQuantity / ratio;
}

/**
 * Trouve l'unité de base (plus petite unité, ratio = 1) d'un produit
 * @param conversions Les conversions d'unités du produit
 * @returns L'ID de l'unité de base, ou null si non trouvée
 */
export function findBaseUnit(conversions: ProductUnitConversion[]): number | null {
  const baseConversion = conversions.find(c => {
    const ratio = parseFloat(String(c.conversionRatio));
    return ratio === 1 || Math.abs(ratio - 1) < 0.000001;
  });
  
  return baseConversion ? baseConversion.unitId : null;
}

/**
 * Calcule la quantité et l'unité à partir d'un montant
 * @param amount Le montant en Ar
 * @param product Le produit
 * @param conversions Les conversions d'unités du produit
 * @returns Un tableau d'options possibles avec { quantity, unitId, unitName }
 */
export async function calculateQuantityFromAmount(
  amount: number,
  product: Product,
  conversions: ProductUnitConversion[]
): Promise<Array<{ quantity: number; unitId: number; unitName: string; price: number }>> {
  const baseUnitId = findBaseUnit(conversions);
  if (!baseUnitId) {
    return [];
  }

  const basePrice = await calculateUnitPrice(product, baseUnitId, conversions);
  if (basePrice === 0) {
    return [];
  }

  const baseQuantity = amount / basePrice;

  // Calculer les options pour chaque unité disponible
  const options = await Promise.all(
    conversions.map(async (conversion) => {
      const quantity = convertFromBaseUnit(baseQuantity, conversion.unitId, conversions);
      const unitPrice = await calculateUnitPrice(product, conversion.unitId, conversions);
      return {
        quantity: Math.round(quantity * 10000) / 10000, // Arrondir à 4 décimales
        unitId: conversion.unitId,
        unitName: conversion.unit?.shortName || conversion.unit?.name || 'unité',
        price: unitPrice,
      };
    })
  );

  // Trier par quantité décroissante (unités plus grandes en premier)
  return options.sort((a, b) => b.quantity - a.quantity);
}

