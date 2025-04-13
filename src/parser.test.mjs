import { describe, it, expect } from 'vitest';
import { parseList, parseListItem, parseString } from './parser.mjs';

describe('parseString', () => {
	it('should move pointer to next line if successful', () => {
		const obj = {};
		const lines = ['[string](name) AutoPlanilha'];
		const result = parseString(lines, 0, obj);
		expect(result).toBe(1);
		expect(obj).toEqual({ name: 'AutoPlanilha' });
	});

	it('should handle multiple valid string properties in sequence', () => {
		const obj = {};
		const lines = [
			'[string](name) AutoPlanilha',
			'[string](description) uma solução de automação'
		];
		lines.forEach((line, idx) => parseString(lines, idx, obj));
		expect(obj).toEqual({
			name: 'AutoPlanilha',
			description: 'uma solução de automação'
		});
	});

	it('should overwrite existing keys if the same key is parsed again', () => {
		const obj = { name: 'OldName' };
		const lines = ['[string](name) NewName'];
		const result = parseString(lines, 0, obj);
		expect(result).toBe(1);
		expect(obj).toEqual({ name: 'NewName' });
	});

	it('should ignore lines that do not match the expected format', () => {
		const obj = {};
		const lines = [
			'[string](name) AutoPlanilha',
			'This is an invalid line',
			'[string](description) uma solução de automação'
		];
		lines.forEach((line, idx) => parseString(lines, idx, obj));
		expect(obj).toEqual({
			name: 'AutoPlanilha',
			description: 'uma solução de automação'
		});
	});
});

describe('parseListItem', () => {
	it('should parse a single item and add it to the target object', () => {
		const obj = {};
		const lines = [
			'[item-start](task1)',
			'[string](name) Task 1',
			'[string](description) Description of Task 1',
			'[item-end]'
		];
		const result = parseListItem(lines, 0, obj);
		expect(result).toBe(4);
		expect(obj).toEqual({
			name: 'Task 1',
			description: 'Description of Task 1'
		});
	});

	it('should not modify the target if no item-start is found', () => {
		const obj = {};
		const lines = ['[string](name) Task 1'];
		const result = parseListItem(lines, 0, obj);
		expect(result).toBe(0);
		expect(obj).toEqual({});
	});
});


describe('parseList', () => {
	it('should parse a list of strings and add them to the target object', () => {
		const obj = {};
		const lines = [
			'[list-start](related_topics)',
			'[string] tesseract',
			'[string] opencv',
			'[string] python',
			'[list-end]'
		];
		const result = parseList(lines, 0, obj);
		expect(result).toBe(5);
		expect(obj).toEqual({
			related_topics: ['tesseract', 'opencv', 'python']
		});
	});

	it('should parse a list of items and add them to the target object', () => {
		const obj = {};
		const lines = [
			'[list-start](tasks)',
			'[item-start](task1)',
			'[string](name) Task 1',
			'[string](description) Description of Task 1',
			'[item-end]',
			'[item-start](task2)',
			'[string](name) Task 2',
			'[string](description) Description of Task 2',
			'[item-end]',
			'[list-end]'
		];
		const result = parseList(lines, 0, obj);
		expect(result).toBe(10);
		expect(obj).toEqual({
			tasks: [
				{ name: 'Task 1', description: 'Description of Task 1' },
				{ name: 'Task 2', description: 'Description of Task 2' }
			]
		});
	});

	it('should not modify the target if no list-start is found', () => {
		const obj = {};
		const lines = ['[string](name) Task 1'];
		const result = parseList(lines, 0, obj);
		expect(result).toBe(0);
		expect(obj).toEqual({});
	});

	it('should handle an empty list correctly', () => {
		const obj = {};
		const lines = ['[list-start](related_topics)', '[list-end]'];
		const result = parseList(lines, 0, obj);
		expect(result).toBe(2);
		expect(obj).toEqual({
			related_topics: []
		});
	});

	it('should ignore lines that do not match the expected format within the list', () => {
		const obj = {};
		const lines = [
			'[list-start](related_topics)',
			'[string] tesseract',
			'Invalid line',
			'[string] opencv',
			'[list-end]'
		];
		const result = parseList(lines, 0, obj);
		expect(result).toBe(5);
		expect(obj).toEqual({
			related_topics: ['tesseract', 'opencv']
		});
	});
});
