import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MockData } from '../../core/mock-data';
import { CATEGORIES } from '../../core/models';

@Component({
  imports: [RouterLink, DecimalPipe],
  selector: 'app-about-page',
  styleUrl: './about-page.scss',
  templateUrl: './about-page.html',
})
export class AboutPage {
  readonly model = inject(MockData).modelInfo;
  readonly categories = CATEGORIES;

  // what each category means, in the same order as CATEGORIES
  readonly meanings = [
    'Little or no risk.',
    'Acceptable. Very sensitive people may feel effects.',
    'Children, older adults and people with asthma may be affected.',
    'Everyone may start to feel effects.',
    'Health alert: everyone may be more seriously affected.',
    'Emergency conditions for the whole population.',
  ];

  // table of contents: [id of the section, label]
  readonly sections = [
    { id: 'pm25', label: 'What is PM2.5' },
    { id: 'data', label: 'Where the data comes from' },
    { id: 'forecast', label: 'How we forecast' },
    { id: 'limits', label: 'Limits' },
    { id: 'categories', label: 'Categories' },
    { id: 'credits', label: 'Credits' },
  ];
}