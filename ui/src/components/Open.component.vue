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
          <div class="p-4 overflow-y-scroll" v-else-if="this.type === 'eaf'">
          <!--<div class="p-4 pl-48 overflow-y-scroll" v-else-if="this.type === 'eaf'">
						<table>
							<tr v-for="tier in this.eaf.tiers">
								<td class="absolute -ml-48 w-44 border-r border-transparent border-r-black bg-gray-50">
									{{ tier.name }}
								</td>
								<td class="whitespace-nowrap">
									<div class="whitespace-nowrap">
										<span v-for="anno in tier.annotations" v-if="tier.annotations.length > 0">
								  		{{ anno }}
										</span>
										<span v-else class="invisible">empty row</span>
									</div>
								</td>
							</tr>
						</table> -->
						<div class="flex box-border flex-row">
							<div class="flex flex-col">
								<div class="h-10 border-b border-black border-r text-xl bg-gray-100">
								  <!-- empty top left cell -->
								</div>
								<div class="h-10 border-b border-black border-r text-xl bg-slate-100 p-2 text-right" v-for="tier in this.eaf.tiers">
									{{ tier.name }}
								</div>
							</div>
							<div class="flex flex-col">
								<div class="h-10 border-b border-black text-xl bg-slate-100">
								  <!-- TODO: this should show a timeline hh:mm:ss:ms or something -->
								</div>
								<div class="h-10 bg-gray-100 relative hover:w-fit" v-bind:style="{ width: eaf.duration * 6400 / 60000 + 25 + 'px' }" v-for="tier in this.eaf.tiers">
								<!-- TODO: move the milliseconds-px conversion somewhere better, and refactor to choose the ratio programmatically, trying to get the full width within a readable range (perhaps allow zooming later) -->
									<div class="hover:!min-w-fit hover:z-10 h-10 text-sm p-1 hover:drop-shadow hover:bg-gray-100 rounded-lg bg-gray-200 border border-gray-800 whitespace-nowrap absolute overflow-hidden"
										v-bind:style="{ width: (anno.end - anno.start) * 6400 / 60000 + 'px', left: (anno.start * 6400 / 60000) + 'px' }"
										v-for="anno in tier.annotations">
										{{ anno.text}}
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
      error: ''
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
						duration: Math.max.apply(Math, Object.values(timeSlots))
					}
					/*
					tiers.forEach((tier) => {
					  if (tier.children.length === 0) {
							// noop
						} else {
							const tierName = tier.attributes.getNamedItem("TIER_ID").value

							const annotations = Array.from(tier.getElementsByTagName("ANNOTATION_VALUE"))
							const annotationsCombined = annotations.reduce((acc, annotation) => {
								return `${acc} ${annotation.innerHTML}`
							}, `${tierName}: `)
							fileData.push(annotationsCombined)
						}
					})

				*/

/*

this.eaf.tiers = [
  { name: "RH_GLOSS_ID", annotations: [
		text: "HOUSE1A"
		// TODO: later this should add time information
	]}
]

*/


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
    }
  }
}
</script>
