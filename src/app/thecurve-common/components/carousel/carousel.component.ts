import { Component, Input, OnInit } from '@angular/core'
import { Observable } from 'rxjs'
import { filter, map, shareReplay } from 'rxjs/operators'

export interface CarouselDot {
  image: {
    src: string
    alt: string
  }
  headline: string
  preview?: string
}

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: [ './carousel.component.scss' ],
})
export class CarouselComponent implements OnInit {
  @Input() carousel$: Observable<CarouselDot[]>
  @Input() onClickReadMore?: (focus: CarouselDot) => Promise<void>
  focusedCarouselDot$: Observable<CarouselDot>

  ngOnInit(): void {
    this.carousel$ = this.carousel$.pipe(
      shareReplay({ bufferSize: 1, refCount: true }),
    )
    this.focusedCarouselDot$ = this.carousel$.pipe(
      map(carousel => carousel[1] || carousel[0]), // middle dot, or 1st dot if there's only 1
      filter(dot => !!dot),
    )
  }
}
