import {
  sanitizeUsername,
  sanitizeDisplayName,
  sanitizeBio,
  sanitizeUrl,
  sanitizeEmail,
  sanitizePhone,
  sanitizeFilename,
  containsMaliciousPatterns,
  escapeHtml,
  stripHtml,
} from '../sanitization';

describe('sanitizeUsername', () => {
  it('should remove special characters', () => {
    expect(sanitizeUsername('user@123!')).toBe('user123');
  });

  it('should remove leading/trailing underscores', () => {
    expect(sanitizeUsername('_username_')).toBe('username');
  });

  it('should collapse multiple underscores', () => {
    expect(sanitizeUsername('user___name')).toBe('user_name');
  });

  it('should allow alphanumeric and underscore', () => {
    expect(sanitizeUsername('user_name_123')).toBe('user_name_123');
  });

  it('should handle empty string', () => {
    expect(sanitizeUsername('')).toBe('');
  });
});

describe('sanitizeDisplayName', () => {
  it('should allow letters, numbers, spaces, hyphens, apostrophes', () => {
    expect(sanitizeDisplayName("John O'Brien-Smith 123")).toBe("John O'Brien-Smith 123");
  });

  it('should remove special characters', () => {
    expect(sanitizeDisplayName('John@Doe!')).toBe('JohnDoe');
  });

  it('should normalize whitespace', () => {
    expect(sanitizeDisplayName('  John   Doe  ')).toBe('John Doe');
  });

  it('should prevent excessive character repetition', () => {
    expect(sanitizeDisplayName('Jooooooohn')).toBe('Jooohn');
  });
});

describe('sanitizeBio', () => {
  it('should strip HTML tags', () => {
    expect(sanitizeBio('<p>Hello <b>World</b></p>')).toBe('Hello World');
  });

  it('should normalize line breaks', () => {
    expect(sanitizeBio('Line1\r\nLine2')).toBe('Line1\nLine2');
  });

  it('should limit consecutive newlines', () => {
    expect(sanitizeBio('Line1\n\n\n\nLine2')).toBe('Line1\n\nLine2');
  });

  it('should trim whitespace', () => {
    expect(sanitizeBio('  Text  ')).toBe('Text');
  });
});

describe('sanitizeUrl', () => {
  it('should allow http and https', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
  });

  it('should allow mailto', () => {
    expect(sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
  });

  it('should block javascript protocol', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
  });

  it('should block data protocol', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
  });

  it('should allow relative URLs', () => {
    expect(sanitizeUrl('/path/to/page')).toBe('/path/to/page');
  });
});

describe('sanitizeEmail', () => {
  it('should convert to lowercase', () => {
    expect(sanitizeEmail('Test@EXAMPLE.COM')).toBe('test@example.com');
  });

  it('should trim whitespace', () => {
    expect(sanitizeEmail('  test@example.com  ')).toBe('test@example.com');
  });
});

describe('sanitizePhone', () => {
  it('should extract only digits', () => {
    expect(sanitizePhone('+1 (555) 123-4567')).toBe('15551234567');
  });

  it('should handle empty string', () => {
    expect(sanitizePhone('')).toBe('');
  });
});

describe('sanitizeFilename', () => {
  it('should remove directory traversal', () => {
    expect(sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd');
  });

  it('should remove path separators', () => {
    expect(sanitizeFilename('path/to/file.txt')).toBe('pathtofile.txt');
  });

  it('should allow safe characters', () => {
    expect(sanitizeFilename('my-file_2023.txt')).toBe('my-file_2023.txt');
  });

  it('should replace unsafe characters with underscore', () => {
    expect(sanitizeFilename('my file!.txt')).toBe('my_file_.txt');
  });
});

describe('containsMaliciousPatterns', () => {
  it('should detect script tags', () => {
    expect(containsMaliciousPatterns('<script>alert("xss")</script>')).toBe(true);
  });

  it('should detect javascript protocol', () => {
    expect(containsMaliciousPatterns('javascript:alert(1)')).toBe(true);
  });

  it('should detect event handlers', () => {
    expect(containsMaliciousPatterns('<img onerror="alert(1)">')).toBe(true);
  });

  it('should detect iframe tags', () => {
    expect(containsMaliciousPatterns('<iframe src="evil.com"></iframe>')).toBe(true);
  });

  it('should detect directory traversal', () => {
    expect(containsMaliciousPatterns('../../etc/passwd')).toBe(true);
  });

  it('should allow safe input', () => {
    expect(containsMaliciousPatterns('Hello World! This is safe.')).toBe(false);
  });
});

describe('escapeHtml', () => {
  it('should escape HTML entities', () => {
    expect(escapeHtml('<div>Test & "quotes"</div>'))
      .toBe('&lt;div&gt;Test &amp; &quot;quotes&quot;&lt;&#x2F;div&gt;');
  });

  it('should escape apostrophes', () => {
    expect(escapeHtml("It's a test")).toBe('It&#x27;s a test');
  });
});

describe('stripHtml', () => {
  it('should remove all HTML tags', () => {
    expect(stripHtml('<p>Hello <b>World</b></p>')).toBe('Hello World');
  });

  it('should handle self-closing tags', () => {
    expect(stripHtml('Text<br/>More text')).toBe('TextMore text');
  });

  it('should handle nested tags', () => {
    expect(stripHtml('<div><span><a>Link</a></span></div>')).toBe('Link');
  });
});
