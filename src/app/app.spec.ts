import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    // jsdom has no matchMedia; the header reads it for the default theme
    window.matchMedia ??= (query: string) => ({ matches: false, media: query }) as MediaQueryList;
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the header and the data attribution', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.logo')?.textContent).toContain('PM2.5 Watch');
    expect(compiled.querySelector('footer')?.textContent).toContain('CAMS via Open-Meteo.com');
  });
});
