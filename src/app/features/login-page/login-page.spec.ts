import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Auth, FAKE_ADMIN } from '../../core/auth/auth';
import { LoginPage } from './login-page';

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginPage);
    await fixture.whenStable();
  });

  it('shows an error for wrong credentials', async () => {
    const page = fixture.componentInstance;
    page.email = FAKE_ADMIN.email;
    page.password = 'wrong';
    await page.submit();
    expect(page.error()).toContain('Wrong');
  });

  it('logs the admin in and goes to the return URL', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture.componentRef.setInput('returnUrl', '/admin');
    const page = fixture.componentInstance;
    page.email = FAKE_ADMIN.email;
    page.password = FAKE_ADMIN.password;
    await page.submit();
    expect(TestBed.inject(Auth).isAdmin()).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/admin');
  });
});
