import { describe, it, expect } from 'vitest';

/**
 * Test suite for utility functions
 */
describe('Utility Functions', () => {
    describe('formatCurrency', () => {
        it('should format cents to dollars', () => {
            const formatCurrency = (cents: number) => {
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                }).format(cents / 100);
            };

            expect(formatCurrency(1000)).toBe('$10.00');
            expect(formatCurrency(9999)).toBe('$99.99');
            expect(formatCurrency(0)).toBe('$0.00');
        });
    });

    describe('truncateText', () => {
        it('should truncate text with ellipsis', () => {
            const truncateText = (text: string, maxLength: number) => {
                if (text.length <= maxLength) return text;
                return text.slice(0, maxLength - 3) + '...';
            };

            expect(truncateText('Hello World', 5)).toBe('He...');
            expect(truncateText('Short', 10)).toBe('Short');
        });
    });

    describe('isValidEmail', () => {
        it('should validate email format', () => {
            const isValidEmail = (email: string) => {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            };

            expect(isValidEmail('test@example.com')).toBe(true);
            expect(isValidEmail('invalid-email')).toBe(false);
            expect(isValidEmail('user@domain.co.uk')).toBe(true);
        });
    });
});
