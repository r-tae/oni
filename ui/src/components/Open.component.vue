<template>
  <el-row :justify="'center'" class="bg-gray-50">
    <el-col :span="20">
      <div class="container max-w-screen-lg mx-auto">
        <el-row>
          <el-col :xs="24" :sm="15" :md="16" :lg="18" :xl="20">
            <h3 class="relative space-x-3 font-bold p-3 text-xl select-none text-left">
              <a class="break-words no-underline text-blue-600 hover:text-blue-800 visited:text-purple-600"
                 :href="'/view?id=' + encodeURIComponent(this.path)">
                <i class="fa fa-1x fa-arrow-left"></i> File Metadata
              </a>
              <span>{{ this.parentTitle || decodeURIComponent(this.path) }}</span>
            </h3>
          </el-col>
          <el-col :xs="24" :sm="9" :md="8" :lg="6" :xl="4">
            <!-- TODO add a download widget here-->
          </el-col>
        </el-row>
        <div v-loading="loading" class="shadow m-6 p-2">
          <div v-if="this.type === 'pdf'">
            <pdf v-for="i in numPages"
                 :key="i"
                 :src="pdfdata"
                 :page="i">
              <template slot="loading">
                loading content here...
              </template>
            </pdf>
          </div>
          <div class="p-4 break-words" v-else-if="this.type === 'txt'">
            <el-table v-if="this.loadCsv" :data="this.csv.data" style="width: 100%">
              <el-table-column v-for="guessedColumn of this.csv.cols"
                               :prop="guessedColumn" :label="guessedColumn"></el-table-column>
            </el-table>
            <div v-else>{{ this.data }}</div>
          </div>
          <div class="p-4" v-else-if="this.type === 'audio'">
            <audio controls>
              <source :src="this.data">
              Your browser does not support the audio element.
            </audio>
          </div>
          <div class="h-max" v-else-if="this.type === 'eaf'">
					  <div>
            	<video @play="handleVideoPlay" @pause="handleVideoPause" @seeking="handleSeeking" @seeked="handleSeeked" controls>
              	<source :src="this.eaf.videoURL" type="video/mp4">
              	Your browser does not support the video element.
            	</video>
						</div>
						<div>
							<button @click="toggleShowEmptyTiers">
								{{
									this.showEmptyTiers ?
										"Show empty tiers"
										:
										"Hide empty tiers"
								}}
							</button>
						</div>
						<div class="overflow-scroll h-screen flex box-border flex-row">
							<div class="flex flex-col h-max">
								<div class="sticky top-0 z-10 h-5 border-b border-black border-r bg-gray-100">
								</div>
								<div class="h-10 border-b border-black border-r text-xl bg-slate-100 p-2 text-right" v-for="tier in filterTiers(this.eaf.tiers)">
									{{ tier.name }}
								</div>
							</div>
							<div class="flex flex-col h-max relative">
								<div class="left-0 w-px absolute h-screen bg-red-500 z-50" v-bind:style="{ transform: 'translate(' + calculateSizeFromTime(this.eaf.duration, this.videoTime) + 'px)' }"/>
								<div class="sticky top-0 z-10 h-5 border-b border-black text-xs bg-slate-100 flex flex-row">
								  <!-- TODO: add vertical lines on the second (will have to use repeating linear gradient based) -->
									<div v-bind:style="{ width: calculateSizeFromTime(this.eaf.duration, 1000) + 'px' }"
										class="border-r border-black h-full self-end" v-for="sec in Math.floor(this.eaf.duration / 1000 + 1)">
									  <!-- HACK: this is spaghetti code but it does work, it outputs the time in the format M:ss, there are no hours shown -->
									  {{ sec == 1 ? "" : `${Math.floor((sec+1)/60)}:${("00" + ((sec - 1) % 60)).slice(-2)}` }}
									</div>
								</div>
								<div class="h-10 even:bg-slate-100 odd:bg-slate-200 relative hover:w-fit"
									v-bind:style="{
										width: calculateSizeFromTime(this.eaf.duration, this.eaf.duration) + 25 + 'px',
										'//background-image': 'repeating-linear-gradient(90deg, transparent, transparent ' + (calculateSizeFromTime(this.eaf.duration, 1000) - 1) + 'px, #e5e7eb ' + (calculateSizeFromTime(this.eaf.duration, 1000) - 1) + 'px, #e5e7eb ' + calculateSizeFromTime(this.eaf.duration, 1000) + 'px)'
									}"
									v-for="tier in filterTiers(this.eaf.tiers)">
									<div
										class="hover:!min-w-fit hover:z-10 h-10 text-sm p-1 overflow-hidden hover:drop-shadow hover:bg-gray-100 rounded-md bg-gray-200 border border-gray-800 whitespace-nowrap absolute"
										v-bind:style="Object.assign(
											{
												width: calculateSizeFromTime(this.eaf.duration, anno.end - anno.start) + 'px',
												left: calculateSizeFromTime(this.eaf.duration, anno.start) + 'px',
											},
											anno.start < this.videoTime && this.videoTime < anno.end ? {
												'min-width':  'fit-content',
												'z-index': '10',
												background: 'rgb(243 244 246)',
												} : {}
										)"
										@click="jumpToTime(anno.start)"
										v-for="anno in tier.annotations">
										{{ anno.text }}
									</div>
								</div>
							</div>
						</div>
          </div>
          <div class="p-4" v-else-if="this.type === 'video'">
            <video controls>
              <source :src="this.data" :type="this.sourceType">
              Your browser does not support the video element.
            </video>
          </div>
          <div class="p-4" v-else-if="this.error">
            <el-alert :title="this.errorMessage" type="warning"
                      :closable="false" center>
              <p class="break-normal text-xl">{{ this.error }}</p>
            </el-alert>
          </div>
          <div class="p-4" v-else>
            <img height="500px" :src="this.data"/>
          </div>
        </div>
      </div>
    </el-col>
  </el-row>
</template>

<script>
import 'element-plus/theme-chalk/display.css'
import pdf from '@jbtje/vue3pdf'
import {first, isUndefined} from 'lodash';
import {VideoPlay} from "@element-plus/icons-vue";


export default {
  components: {
    VideoPlay,
    pdf
  },
  data() {
    return {
      title: '',
      pdfdata: null,
      numPages: 1,
      data: null,
      type: 'text',
      sourceType: '',
      id: '',
      parentId: '',
      path: '',
      name: '',
      parent: '',
      parentTitle: '',
      loadCsv: false,
      csv: {},
      loading: false,
      errorMessage: '',
      error: '',
			ratio: null,
			videoTime: null,
			videoUpdateIntervalID: null,
			showEmptyTiers : false,
  		calculateSizeFromTime: function (fullDuration, time) {
				const lerp = (a, b, t) => a + (b - a) * Math.min(1, t)

				if (!this.ratio) {
					// Interpolate from pixelsPerMinute.min for smaller files up to a max density of pixelsPerMinute.max
					const pixelsPerMinute = {
						min: 5000,
						max: 2000,
					}
					const minPpmTarget = 120000 // 2 minutes
					const targetPixelsPerMinute = lerp(pixelsPerMinute.max, pixelsPerMinute.min, fullDuration / minPpmTarget)
					this.ratio = targetPixelsPerMinute / fullDuration
				}

				// calculation ms/px ratio
				return Number(time) * this.ratio
			},
    }
  },
  async mounted() {
    this.loading = true;
    const id = encodeURIComponent(this.$route.query.id);
    this.id = id;
    this.parentId = encodeURIComponent(this.$route.query.parentId);
    this.path = this.$route.query.path;
    let route = `/object/open?id=${id}`;
    if (this.path != '') {
      route += `&path=${this.path}`;
    }
    let response;
    try {
      response = await this.$http.get({route: route});
      if (response.status !== 200) {
        this.errorMessage = 'There was an error loading the file';
        if (response.status === 404) {
          this.error = 'The file was not found in the path, please contact your Data Provider or Data Steward';
        } else {
          this.error = response.statusText;
        }
        this.loading = false;
        return;
      }
    } catch (e) {
      console.log(response);
      this.errorMessage = 'File Not Found';
      this.error = e.message;
      this.loading = false;
      return;
    }
    const title = decodeURIComponent(this.$route.query.title);
    if (title) {
      this.title = title;
    }
    const parent = decodeURIComponent(this.$route.query.parent);
    if (parent) {
      this.parent = parent;
    }
    const parentTitle = decodeURIComponent(this.$route.query.parentTitle);
    if (parentTitle) {
      this.parentTitle = parentTitle;
    }
    //TODO: Ask for MIME types
    //TODO: craete some file widgets
    if (this.path && (this.path.endsWith(".txt") || this.path.endsWith(".csv"))) {
      this.type = 'txt';
      this.data = await response.text();
      if (this.path.endsWith(".csv")) {
        try {
          const parsedCsv = this.$papa.parse(this.data);
          if (parsedCsv?.data && parsedCsv?.data?.length > 1) {
            //Guess that the first elements are the headers. Then shift the array.
            this.csv.cols = first(parsedCsv.data);
            parsedCsv.data.shift();
            this.csv.data = parsedCsv.data.map((r) => {
              const row = {};
              for (let [index, col] of this.csv.cols.entries()) {
                if (isUndefined(col) || col === "") {
                  col = '__nocolumn__';
                }
                row[col] = r[index];
              }
              return row;
            });
            this.loadCsv = true;
          } else {
            this.loadCsv = false;
          }
        } catch (e) {
          this.errorMessage = 'Cannot automatically convert to csv.'
          console.log(e);
          this.loading = false;
        }
      }
    } else {
      try {
        this.data = await response.blob();
        const blobURL = window.URL.createObjectURL(this.data);
        if (this.path && (this.path.endsWith(".mp3") || this.path.endsWith(".wav"))) {
          this.type = 'audio';
          this.data = blobURL;
        } else if (this.path && this.path.endsWith(".mp4")) {
          this.type = 'video';
          this.sourceType = 'video/mp4';
          this.data = blobURL;
        } else if (this.path && this.path.endsWith(".eaf")) {
					const fileData = []

    			let route = `/object/open?id=${decodeURIComponent(this.parentId)}`;
      		let sibling_objects = await this.$http.get({route: route});

					// TODO: error handling

					sibling_objects = await sibling_objects.json()
					console.log(sibling_objects)

					// HACK: the objects on the parent are provided as urls that look like http://localhost:8080/stream?id=arcp://name,auslan/item/BSS_c6ii I don't know why
					let videoId = sibling_objects.parts.find(x => x["@id"].slice(-3) == "mp4")["@id"].slice(32)

    			let videoRoute = `/object/open?id=${decodeURIComponent(videoId)}`;
      		let videoBlob = await (await this.$http.get({route: videoRoute, path: videoRoute})).blob()
					let videoURL = window.URL.createObjectURL(videoBlob)
					console.log({videoURL})


					const parser = new DOMParser()
					const xmlDoc = parser.parseFromString(await this.data.text(), "text/xml")

					// build timeSlot dictionary
					const timeSlots = {}
					for (const timeSlot of Array.from(xmlDoc.getElementsByTagName("TIME_SLOT"))) {
						const timeSlotId = timeSlot?.attributes.getNamedItem("TIME_SLOT_ID").value
						const timeSlotValue = timeSlot?.attributes.getNamedItem("TIME_VALUE").value
						timeSlots[timeSlotId] = timeSlotValue
					}
					const timeSlotRefToTimecode = (id) => timeSlots[id]

					const tiers = Array.from(xmlDoc.getElementsByTagName("TIER")).map(tier => {
						return {
							name: tier.attributes.getNamedItem("TIER_ID").value,
							annotations: Array.from(tier.getElementsByTagName("ALIGNABLE_ANNOTATION")).map(anno => {
								const text = anno.getElementsByTagName("ANNOTATION_VALUE")[0]?.innerHTML
								const start = timeSlots[anno.attributes.getNamedItem("TIME_SLOT_REF1").value]
								const end = timeSlots[anno.attributes.getNamedItem("TIME_SLOT_REF2").value]
								//TIME_SLOT_REF1="ts18" TIME_SLOT_REF2="ts21"
								return {
									text,
									start,
									end,
								}
							})
						}
					})
					this.eaf = {
					 	tiers,
					 	videoURL,
						duration: Math.max.apply(Math, Object.values(timeSlots))
					}
          this.type = 'eaf';
          this.sourceType = 'text/x-eaf+xml';
					this.data = fileData.join(`\n\n`)
        } else if (this.path && this.path.endsWith(".pdf")) {
          this.type = 'pdf';
          this.pdfdata = pdf.createLoadingTask(blobURL);
          this.pdfdata.promise.then(pdf => {
            this.numPages = pdf.numPages;
            console.log(`this.numPages: ${this.numPages} pdf.numPages: ${pdf.numPages}`);
          });
        } else {
          this.type = 'other';
          this.data = blobURL;
        }
        this.loading = false;
      } catch (e) {
        this.errorMessage = 'File cannot be loaded';
        this.error = e.message;
        this.loading = false;
      }
    }
    this.loading = false;
  },
  methods: {
    getTitle() {
      const title = first(this.meta['name']);
      return title?.['@value'] || this.meta['@id'];
    },
		handleVideoPlay(event) {
			this.videoTime = event.target.currentTime * 1000
			this.videoUpdateIntervalID = setInterval(() => {
				this.videoTime = this.videoTime + 100
			}, 100)
		},
		handleVideoPause(event) {
			clearInterval(this.videoUpdateIntervalID)
			this.videoTime = event.target.currentTime * 1000
		},
		handleSeeking(event) {
			this.videoTime = event.target.currentTime * 1000
		},
		handleSeeked(event) {
			this.videoTime = event.target.currentTime * 1000
		},
		jumpToTime(time) {
		  // HACK: assumes there is only one video on the page
      let video = this.$el.querySelector('video')
      video.currentTime = time / 1000
    },
  	toggleShowEmptyTiers() {
			this.showEmptyTiers = !this.showEmptyTiers
		},
		filterTiers(tiers) {
			if (this.showEmptyTiers) {
				return tiers
			}
			else {
				return tiers.filter(t => t.annotations.some(a => a.text))
			}
		}
  }
}
</script>
