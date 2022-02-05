import { Component, OnInit } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { Observable, of } from 'rxjs'
import { CarouselDot } from 'src/app/thecurve-common/components/carousel/carousel.component'



@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: [ './landing.component.scss' ],
})
export class LandingComponent implements OnInit {
  news$: Observable<CarouselDot[]>
  newsletterForm: FormGroup

  ngOnInit(): void {
    this.news$ = of([
      {
        image: { src: '', alt: '' },
        headline: 'Item 1',
        preview: '',
      },
      {
        image: { src: '', alt: '' },
        headline: 'Curve Plus: August',
        preview: 'The latest chat rooms, games and interactions from The Curve creators just for you.',
      },
      {
        image: { src: '', alt: '' },
        headline: 'Item 3',
        preview: '',
      },
    ])
    this.newsletterForm = new FormGroup({
      email: new FormControl('', [ Validators.required, Validators.email ]),
    })
  }

  async submitNewsletterForm(): Promise<void> {
    // pass
  }

  async expandFocusedNews(_focus: CarouselDot) {
    // pass
  }

}
