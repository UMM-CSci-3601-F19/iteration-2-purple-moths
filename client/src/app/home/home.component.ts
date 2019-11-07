import {Component, OnInit} from '@angular/core';
import {Room} from './room';
import {History} from './history';
import {Machine} from './machine';
import {Observable} from 'rxjs';
import {HomeService} from './home.service';

import * as Chart from 'chart.js';

@Component({
  templateUrl: 'home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {

  /*
   * This is a switch for the E2E test
   * before running the tests
   * set autoRefresh to be true,
   * after testing, set the boolean
   * back to true in order to make
   * the functionality works.
   */
  private autoRefresh = true;

  public machineListTitle: string;
  public brokenMachineListTitle: string;
  public rooms: Room[];
  public machines: Machine[];
  public filteredMachines: Machine[];
  public numOfBroken: number;
  public numOfWashers: number;
  public numOfDryers: number;

  public roomId = '';
  public roomName = 'All rooms';
  public selectorState: number;
  public numOfVacant: number;
  public numOfAll: number;

  public mapWidth: number;
  public mapHeight: number;

  public history: History[];
  // public filteredHistory: History[];
  canvas: any;
  ctx: any;
  myChart: any;
  chart = 'myChart';
  public inputRoom = 'all';
  public today = new Date();
  public inputDay: number = this.today.getDay() + 1;
  Days = [
    {value: 1, name: 'Sunday'},
    {value: 2, name: 'Monday'},
    {value: 3, name: 'Tuesday'},
    {value: 4, name: 'Wednesday'},
    {value: 5, name: 'Thursday'},
    {value: 6, name: 'Friday'},
    {value: 7, name: 'Saturday'},
  ];

  /*
  public gayHistory: History[];
  public independenceHistory: History;
  public blakelyHistory: History;
  public spoonerHistory: History;
  public greenPrairieHistory: History;
  public pineHistory: History;
  public theApartmentsHistory: History;
*/
  constructor(public homeService: HomeService) {
    this.machineListTitle = 'within all rooms';
    this.brokenMachineListTitle = 'Unavailable machines within all rooms';
  }

  setSelector(state: number) {
    this.selectorState = state;
  }

  public updateRoom(newId: string, newName: string): void {
    this.roomId = newId;
    this.roomName = newName;
    this.machineListTitle = 'available within ' + this.roomName;
    this.brokenMachineListTitle = 'Unavailable machines within ' + this.roomName;
    if (newId === '') {
      this.inputRoom = 'all';
    } else {
      this.inputRoom = newId;
    }
    this.inputDay = this.today.getDay() + 1;
    this.updateMachines();
    this.delay(100);
    this.buildChart();
    this.fakePositions();
    this.setSelector(1);
    // document.getElementById('allMachineList').style.display = 'unset';
    document.getElementById('all-rooms').style.bottom = '2%';
    this.scroll('mainBody');
  }

  private updateMachines(): void {
    // console.log(this.inputRoom);
    if (this.roomId == null || this.roomId === '') {
      this.filteredMachines = this.machines;
    } else {
      this.filteredMachines = this.machines.filter(machine => machine.room_id === this.roomId);
    }
    this.homeService.updateRunningStatus(this.filteredMachines, this.machines);
    if (this.filteredMachines !== undefined) {
      this.numOfBroken = this.filteredMachines.filter(m => m.status === 'broken').length;
      this.numOfWashers = this.filteredMachines.filter(m => m.status === 'normal' && m.type === 'washer').length;
      this.numOfDryers = this.filteredMachines.filter(m => m.status === 'normal' && m.type === 'dryer').length;
      this.mapHeight = this.filteredMachines.reduce((max, b) => Math.max(max, b.position.y), this.filteredMachines[0].position.y);
      this.mapWidth = this.filteredMachines.reduce((max, b) => Math.max(max, b.position.x), this.filteredMachines[0].position.x);
    }
  }

  // filterGraphData() {
  //   if (this.inputRoom !== 'all') {
  //     this.filteredHistory = this.history.filter(history => history.room_id === this.inputRoom);
  //
  //   } else {
  //
  //     this.gayHistory = this.history.filter(history => history.room_id === 'gay');
  //     this.independenceHistory = this.history.filter(history => history.room_id === 'independence');
  //     this.blakelyHistory = this.history.filter(history => history.room_id === 'blakely');
  //     this.spoonerHistory = this.history.filter(history => history.room_id === 'spooner');
  //     this.greenPrairieHistory = this.history.filter(history => history.room_id === 'green_prairie');
  //     this.pineHistory = this.history.filter(history => history.room_id === 'pine');
  //     this.theApartmentsHistory = this.history.filter(history => history.room_id === 'the_apartments');
  //   }
  // }


  updateDayByButton(num: number) {
    this.inputDay = (+this.inputDay + +num) % 7;
    if (this.inputDay === 0) {
      this.inputDay = 7;
    }
    this.buildChart();
  }


  updateDayBySelector(num: number) {
    // console.log('in selector inputday was' + this.inputDay);
    this.inputDay = +num;
    this.buildChart();
    // console.log('in selector inputday is' + this.inputDay);
  }

  getWeekDayByRoom(room, wekd, addition?): number[] {

    console.log(wekd);
    const tempWekd: Array<number> = [];
    if (this.history !== undefined) {
      for (let i = 0; i < 48; i++) {
        tempWekd.push(this.history.filter(history => history.room_id === room).pop()[wekd][i]);
      }
      if (addition !== undefined && addition === true) {
        ++wekd;
        if (wekd === 8) {
          wekd = 1;
        }
        for (let i = 0; i < 6; i++) {
          tempWekd.push(this.history.filter(history => history.room_id === room).pop()[wekd][i]);
        }
      }
    }
    console.log(wekd);
    return tempWekd;
  }

  modifyArray(arr, num, addition?): number[] {
    const temp: Array<number> = [];
    let i = 0;
    for (; i < 48; i = i + num) {
      let sum = 0;
      for (let j = 0; j < num; j++) {
        sum = sum + arr[j + i];
      }
      temp.push(sum / num);
    }
    if (addition !== undefined && addition === true) {
      for (; i < 54; i = i + num) {
        let sum = 0;
        for (let j = 0; j < num; j++) {
          sum = sum + arr[j + i];
        }
        temp.push(sum / num);
      }
    }
    return temp;
  }

  loadAllMachines(): void {
    const machines: Observable<Machine[]> = this.homeService.getMachines();
    machines.subscribe(
      // tslint:disable-next-line:no-shadowed-variable
      machines => {
        this.machines = machines;
      },
      err => {
        console.log(err);
      });
  }

  loadAllRooms(): void {
    const rooms: Observable<Room[]> = this.homeService.getRooms();
    rooms.subscribe(
      // tslint:disable-next-line:no-shadowed-variable
      rooms => {
        this.rooms = rooms;
      },
      err => {
        console.log(err);
      });
  }

  loadAllHistory(): void {
    const histories: Observable<History[]> = this.homeService.getAllHistory();
    histories.subscribe(
      history => {
        this.history = history;
      },
      err => {
        console.log(err);
      });
  }

  buildChart() {
    this.myChart = null;
    if (this.history !== undefined) {
      this.canvas = document.getElementById(this.chart);
      this.ctx = this.canvas;

      let xlabel;
      let xlabel2;
      // this.filterGraphData();

      xlabel = ['0a', null, '2a', null, '4a', null, '6a', null, '8a', null, '10a', null, '12p', null, '2p', null, '4p', null,
        '6p', null, '8p', null, '10p', null];

      xlabel2 = ['0a', '3a', '6a', '9a', '12p', '3p', '6p', '9p', '12p'];

      if (this.inputRoom !== 'all') {
        this.myChart = new Chart(this.ctx, {
          type: 'bar',
          data: {
            labels: xlabel,
            datasets: [{
              data: this.modifyArray(this.getWeekDayByRoom(this.inputRoom, this.inputDay), 2),
              backgroundColor: 'rgb(186,104,203)'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            legend: {
              display: false,
            },
            tooltips: {
              enabled: false,
              // callbacks: {
              //   label: function(tooltipItem) {
              //     console.log(tooltipItem);
              //     return tooltipItem.yLabel;
              //   }
              // }
            },
            scales: {
              xAxes: [{
                gridLines: {
                  display: false
                },
                ticks: {
                  fontSize: 15,
                  fontColor: 'rgb(150, 150, 150)'
                }
              }],
              yAxes: [{
                gridLines: {
                  display: false,
                },
                ticks: {
                  display: false,
                  beginAtZero: true
                }
              }]
            }
          }
        });
      } else {
        this.myChart = new Chart(this.ctx, {
          type: 'line',
          data: {
            labels: xlabel2,
            datasets: [
              {
                label: 'Gay',
                data: this.modifyArray(this.getWeekDayByRoom('gay', this.inputDay, true), 6, true),
                hidden: false,
                fill: false,
                lineTension: 0.2,
                borderColor: 'rgb(255,99,132)',
                backgroundColor: 'rgb(255,99,132)'
              },
              {
                label: 'Independence',
                data: this.modifyArray(this.getWeekDayByRoom('independence', this.inputDay, true), 6, true),
                hidden: false,
                fill: false,
                lineTension: 0.2,
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgb(54, 162, 235)'
              },
              {
                label: 'Blakely',
                data: this.modifyArray(this.getWeekDayByRoom('blakely', this.inputDay, true), 6, true),
                hidden: false,
                fill: false,
                lineTension: 0.2,
                borderColor: 'rgb(255, 206, 86)',
                backgroundColor: 'rgb(255, 206, 86)'
              },
              {
                label: 'Spooner',
                data: this.modifyArray(this.getWeekDayByRoom('spooner', this.inputDay, true), 6, true),
                hidden: false,
                fill: false,
                lineTension: 0.2,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgb(75, 192, 192)'
              },
              {
                label: 'Green Prairie',
                data: this.modifyArray(this.getWeekDayByRoom('green_prairie', this.inputDay, true), 6, true),
                hidden: false,
                fill: false,
                lineTension: 0.2,
                borderColor: 'rgb(153, 102, 255)',
                backgroundColor: 'rgb(153, 102, 255)'
              },
              {
                label: 'Pine',
                data: this.modifyArray(this.getWeekDayByRoom('pine', this.inputDay, true), 6, true),
                hidden: false,
                fill: false,
                lineTension: 0.2,
                borderColor: 'rgb(255, 159, 64)',
                backgroundColor: 'rgb(255, 159, 64)'
              },
              {
                label: 'Apartments',
                data: this.modifyArray(this.getWeekDayByRoom('the_apartments', this.inputDay, true), 6, true),
                hidden: false,
                fill: false,
                lineTension: 0.2,
                borderColor: 'rgb(100,100,100)',
                backgroundColor: 'rgb(100,100,100)'
              },
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            elements: {
              point: {
                radius: 3
              }
            },
            scales: {
              xAxes: [{
                gridLines: {
                  display: false
                },
                ticks: {
                  fontSize: 15,
                  fontColor: 'rgb(150, 150, 150)'
                }
              }],
              yAxes: [{
                gridLines: {
                  display: false,
                },
                ticks: {
                  display: false,
                  beginAtZero: true
                }
              }]
            },
            legend: {
              position: 'right',
              display: window.innerWidth > 500,
            }
          },
        });
      }
    }
  }

  ngOnInit(): void {
    (async () => {
      this.setSelector(0);
      this.loadAllRooms();
      this.loadAllMachines();
      this.loadAllHistory();

      await this.delay(500); // wait 0.5s for loading data

      // this.myChart.destroy();
      this.buildChart();
      this.updateMachines();
      this.homeService.updateAvailableMachineNumber(this.rooms, this.machines);
      this.updateCounter();
      this.updateTime();
      await this.delay(500); // wait 1s for loading data
      document.getElementById('loadCover').style.display = 'none';
    }) ();
  }

  updateTime(): void {
    (async () => {
      this.loadAllMachines();
      this.homeService.updateRunningStatus(this.filteredMachines, this.machines);
      this.homeService.updateAvailableMachineNumber(this.rooms, this.machines);
      this.updateCounter();
      if (this.autoRefresh) {
        await this.delay(60000); // hold 60s for the next refresh
        console.log('Refresh');
        this.updateTime();
      }
    }) ();
  }

  updateCounter(): void {
    this.numOfVacant = 0;
    this.numOfAll = 0;
    if (this.rooms !== undefined) {
      this.rooms.map(r => {
        this.numOfVacant += r.numberOfAvailableMachines;
        this.numOfAll += r.numberOfAllMachines;
      });
    } else {
      this.numOfVacant = 0;
      this.numOfAll = 0;
    }
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  scroll(id: string) {
    this.delay(150).then(() => document.getElementById(id).scrollIntoView());
  }

  hideSelector() {
    document.getElementById('all-rooms').style.bottom = '-50px';
  }

  fakePositions() {
    const w =  5;
    const machines = this.filteredMachines;
    for (let i = 0; i < machines.length;  ++i) {
      machines[i].position.x = i % w * 50;
      machines[i].position.y = Math.floor(i / w) * 50;
      // console.log('x' + machines[i].position.x);
      // console.log('y' + machines[i].position.y);
    }
  }

  translateRoomId(roomId: string): string {
    const room = this.rooms.filter(r => r.id === roomId)[0];
    return room.name;
  }

  translateMachineName(name: string): string {
    name = name.replace('-', ' ');
    name = name.replace('-', ' ');
    // return name.substr(0, i).toUpperCase() + ' ' + name.substr(i + 1, j).toUpperCase()
    //   + ' ' + name.substr(j + 1).toUpperCase();
    return name;
  }

  public generateCustomLink(machineRoomID: string, machineType: string, machineID: string): string {
    if (machineRoomID === 'the_apartments') {
      // tslint:disable-next-line:max-line-length
      return 'https://docs.google.com/forms/d/e/1FAIpQLSdU04E9Kt5LVv6fVSzgcNQj1YzWtWu8bXGtn7jhEQIsqMyqIg/viewform?entry.1000002=Apartment Community Building (Cube)&entry.1000005=Laundry room&entry.1000010=Resident&entry.1000006=Other&entry.1000007=issue with ' + machineType + ' ' + machineID + ': ';
    } else if (machineRoomID === 'gay') {
      // tslint:disable-next-line:max-line-length
      return 'https://docs.google.com/forms/d/e/1FAIpQLSdU04E9Kt5LVv6fVSzgcNQj1YzWtWu8bXGtn7jhEQIsqMyqIg/viewform?entry.1000002=Clayton A. Gay&entry.1000005=Laundry room&entry.1000010=Resident&entry.1000006=Other&entry.1000007=issue with ' + machineType + ' ' + machineID + ': ';
    } else if (machineRoomID === 'green_prairie') {
      // tslint:disable-next-line:max-line-length
      return 'https://docs.google.com/forms/d/e/1FAIpQLSdU04E9Kt5LVv6fVSzgcNQj1YzWtWu8bXGtn7jhEQIsqMyqIg/viewform?entry.1000002=Green Prairie Community&entry.1000005=Laundry room&entry.1000010=Resident&entry.1000006=Other&entry.1000007=issue with ' + machineType + ' ' + machineID + ': ';
    } else if (machineRoomID === 'pine') {
      // tslint:disable-next-line:max-line-length
      return 'https://docs.google.com/forms/d/e/1FAIpQLSdU04E9Kt5LVv6fVSzgcNQj1YzWtWu8bXGtn7jhEQIsqMyqIg/viewform?entry.1000002=Pine&entry.1000005=Laundry room&entry.1000010=Resident&entry.1000006=Other&entry.1000007=issue with ' + machineType + ' ' + machineID + ': ';
    } else if (machineRoomID === 'independence') {
      // tslint:disable-next-line:max-line-length
      return 'https://docs.google.com/forms/d/e/1FAIpQLSdU04E9Kt5LVv6fVSzgcNQj1YzWtWu8bXGtn7jhEQIsqMyqIg/viewform?entry.1000002=David C. Johnson Independence&entry.1000005=Laundry room&entry.1000010=Resident&entry.1000006=Other&entry.1000007=issue with ' + machineType + ' ' + machineID + ': ';
    } else if (machineRoomID === 'spooner') {
      // tslint:disable-next-line:max-line-length
      return 'https://docs.google.com/forms/d/e/1FAIpQLSdU04E9Kt5LVv6fVSzgcNQj1YzWtWu8bXGtn7jhEQIsqMyqIg/viewform?entry.1000002=Spooner&entry.1000005=Laundry room&entry.1000010=Resident&entry.1000006=Other&entry.1000007=issue with ' + machineType + ' ' + machineID + ': ';
    } else {
      // tslint:disable-next-line:max-line-length
      return 'https://docs.google.com/forms/d/e/1FAIpQLSdU04E9Kt5LVv6fVSzgcNQj1YzWtWu8bXGtn7jhEQIsqMyqIg/viewform?entry.1000002=Blakely&entry.1000005=Laundry room&entry.1000010=Resident&entry.1000006=Other&entry.1000007=issue with ' + machineType + ' ' + machineID + ': ';
    }
  }



  // getX(machine: Machine) {
  //   const x = machine.position.x * 20;
  //   return x + 'px';
  // }

  // getY(machine: Machine) {
  //   const y = machine.position.y * 20;
  //   return y + 'px';
  // }
  getGridCols() {
    return Math.min(window.innerWidth / 320, 4);
  }

  getGraphCols() {
    return Math.min(window.innerWidth / 600, 2);
  }
}
