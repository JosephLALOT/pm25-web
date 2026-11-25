import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminData } from '../../core/admin-data';
import { AdminPage } from './admin-page';

describe('AdminPage', () => {
  let fixture: ComponentFixture<AdminPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPage],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(AdminPage);
    await fixture.whenStable();
  });

  it('lists the cities', () => {
    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
    expect(rows.length).toBe(TestBed.inject(AdminData).cities().length);
  });

  it('adds a valid city and refuses a duplicate slug', () => {
    const page = fixture.componentInstance;
    const data = TestBed.inject(AdminData);
    const before = data.cities().length;

    page.form = { slug: 'hcmc', name: 'Ho Chi Minh City', country: 'vn', latitude: 10.82, longitude: 106.63, timezone: 'Asia/Ho_Chi_Minh' };
    page.add();
    expect(page.error()).toBe('');
    expect(data.cities().length).toBe(before + 1);
    expect(data.cities().at(-1)?.country).toBe('VN');

    page.form = { slug: 'hanoi', name: 'Hanoi', country: 'VN', latitude: 21, longitude: 105, timezone: 'Asia/Ho_Chi_Minh' };
    page.add();
    expect(page.error()).toContain('already exists');
  });

  it('deactivates a city', () => {
    fixture.componentInstance.setActive('hanoi', false);
    expect(TestBed.inject(AdminData).cities().find(c => c.slug === 'hanoi')?.is_active).toBe(false);
  });
});
